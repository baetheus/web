import * as Effect from "@baetheus/fun/effect";
import * as Option from "@baetheus/fun/option";

import * as RouteBuilder from "./builder.ts";
import * as Router from "./router.ts";

/**
 * Configuration options for the static file plugin.
 *
 * @since 0.1.0
 */
export type StaticPluginOptions = {
  readonly name: string;
  readonly middleware: Router.Middleware<unknown>[];
  readonly exclude_extensions: string[];
};

/**
 * Creates a static file plugin that serves files directly from the filesystem.
 * Automatically sets Content-Type headers based on file extension.
 *
 * @example
 * ```ts
 * import { static_plugin } from "@baetheus/pick/plugin_static";
 *
 * const plugin = static_plugin({
 *   exclude_extensions: [".ts", ".tsx"],
 * });
 * ```
 *
 * @since 0.1.0
 */
export function static_plugin(
  {
    name = "DefaultStaticPlugin",
    middleware = [],
    exclude_extensions = [],
  }: Partial<StaticPluginOptions> = {},
): RouteBuilder.Plugin {
  return {
    name,
    process_file: (file_entry) => {
      if (exclude_extensions.includes(file_entry.parsed_path.ext)) {
        return Effect.right([]);
      }
      const headers: HeadersInit = Option.isSome(file_entry.mime_type)
        ? [["Content-Type", file_entry.mime_type.value]]
        : [];
      return Effect.gets((config) => [
        RouteBuilder.full_route(
          name,
          file_entry.parsed_path,
          Router.route(
            "GET",
            file_entry.relative_path,
            RouteBuilder.wrap_handler(
              async (_req, _params, ctx) => {
                try {
                  const stream = await config.fs.read(file_entry.parsed_path);
                  return new Response(stream, { headers });
                } catch (error) {
                  ctx.logger.warn(
                    RouteBuilder.build_error("Unable to read static file", {
                      path: file_entry.relative_path,
                      error,
                    }),
                  );
                  return Router.text(
                    "Internal Server Error",
                    Router.STATUS_CODE.InternalServerError,
                  );
                }
              },
              middleware,
            ),
          ),
        ),
      ]);
    },
    process_build: (_routes) => Effect.right([]),
  };
}
