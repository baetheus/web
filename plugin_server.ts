import * as D from "@baetheus/fun/decoder";
import * as Effect from "@baetheus/fun/effect";
import * as Either from "@baetheus/fun/either";
import { pipe } from "@baetheus/fun/fn";

import * as Router from "./router.ts";
import * as Tokens from "./tokens.ts";
import * as Builder from "./builder.ts";

/**
 * Configuration options for the server plugin.
 *
 * @since 0.1.0
 */
export type ServerPluginOptions = {
  readonly name: string;
  readonly middleware: Router.Middleware<unknown>[];
  readonly include_extensions: string[];
};

export function apply_schema_validation(
  partial: Tokens.PartialRoute,
): Tokens.PartialRoute {
  const { schema_handler, params_schema, body_schema } = partial;

  if (!schema_handler && !body_schema && !params_schema) {
    return partial;
  }

  const validated_handler: Router.Handler = async (req, params, ctx) => {
    let decoded_params = params;
    if (params_schema) {
      const decoder = params_schema(D.SchemableDecoder);
      const result = decoder(params);
      if (Either.isLeft(result)) {
        return [Either.left(Router.text(
          D.draw(result.left),
          Router.STATUS_CODE.BadRequest,
        ))];
      }
      decoded_params = result.right as URLPatternResult;
    }

    if (schema_handler) {
      let decoded_body: unknown = undefined;
      if (body_schema) {
        let raw: unknown;
        try {
          raw = await req.json();
        } catch {
          return [Either.left(Router.text(
            "Invalid JSON body",
            Router.STATUS_CODE.BadRequest,
          ))];
        }
        const decoder = body_schema(D.SchemableDecoder);
        const result = decoder(raw);
        if (Either.isLeft(result)) {
          return [Either.left(Router.text(
            D.draw(result.left),
            Router.STATUS_CODE.BadRequest,
          ))];
        }
        decoded_body = result.right;
      }
      const response = await schema_handler(
        req,
        decoded_params,
        decoded_body,
        ctx,
      );
      return [Either.right(response)];
    }

    // Plain handler with only params validation
    return partial.handler(req, decoded_params, ctx);
  };

  return { ...partial, handler: validated_handler };
}

/**
 * Creates a server plugin that scans files for exported PartialRoute tokens
 * and converts them into full routes for the router.
 *
 * When a PartialRoute declares `params_schema` or `body_schema`, the plugin
 * automatically validates incoming requests:
 * - Invalid JSON body → 400 with parse error
 * - Schema mismatch → 400 with decode error details
 * - Valid request → handler receives decoded params and body
 *
 * @example
 * ```ts
 * import { server_plugin } from "@baetheus/pick/plugin_server";
 *
 * const plugin = server_plugin({
 *   name: "ApiPlugin",
 *   middleware: [authMiddleware],
 *   include_extensions: [".ts"],
 * });
 * ```
 *
 * @since 0.1.0
 */
export function server_plugin(
  {
    name = "DefaultServerPlugin",
    middleware = [],
    include_extensions = [".ts", ".tsx"],
  }: Partial<ServerPluginOptions>,
): Builder.Plugin {
  return {
    name,
    process_file: (file_entry) => {
      if (!include_extensions.includes(file_entry.parsed_path.ext)) {
        return Effect.right([]);
      }
      return pipe(
        Builder.safe_import(file_entry.parsed_path),
        Effect.map((exports) =>
          Object.values(exports)
            .filter(Tokens.is_partial_route)
            .map((partial_route) =>
              Builder.from_partial_route(
                name,
                file_entry,
                Builder.wrap_partial_route(
                  apply_schema_validation(partial_route),
                  middleware,
                ),
              )
            )
        ),
      );
    },
    process_build: (_routes) => Effect.right([]),
  };
}
