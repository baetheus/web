import type { ComponentChildren, FunctionComponent } from "preact";
import type { Schema } from "@baetheus/fun/schemable";

import * as Refinement from "@baetheus/fun/refinement";

import type { Ctx, Handler, Methods } from "./router.ts";

const PartialRouteSymbol = "PARTIAL_ROUTE" as const;
type PartialRouteSymbol = typeof PartialRouteSymbol;

/**
 * Handler type for config-form routes that receive decoded params and body.
 *
 * @since 0.5.0
 */
export type SchemaHandler<P = unknown, B = unknown> = (
  req: Request,
  params: P,
  body: B,
  ctx: Ctx<unknown>,
) => Response | Promise<Response>;

/**
 * Config object for PartialRoute builders with typed params and body.
 *
 * @example
 * ```ts
 * import type { PartialRouteConfig } from "@baetheus/pick/tokens";
 *
 * const config: PartialRouteConfig<{ id: string }> = {
 *   params: schema(s => s.struct({ id: s.string() })),
 *   handler: (req, params, body, ctx) => new Response(`ID: ${params.id}`),
 * };
 * ```
 *
 * @since 0.1.0
 */
export type PartialRouteConfig<P = unknown, B = unknown, O = unknown> = {
  readonly params?: Schema<P>;
  readonly body?: Schema<B>;
  readonly output?: Schema<O>;
  readonly handler: SchemaHandler<P, B>;
};

/**
 * A partial route definition containing method, handler, and optional schemas.
 *
 * @since 0.1.0
 */
export type PartialRoute = {
  readonly type: PartialRouteSymbol;
  readonly method: Methods;
  readonly handler: Handler;
  readonly params_schema?: Schema<unknown>;
  readonly body_schema?: Schema<unknown>;
  /** @documentation-only Schema for response — not enforced at runtime. */
  readonly output_schema?: Schema<unknown>;
  /** Present when the route was created via config form; carries typed params and body. */
  readonly schema_handler?: SchemaHandler;
};

/**
 * Creates a PartialRoute with the given method and handler.
 *
 * @since 0.1.0
 */
export function partial_route(
  method: Methods,
  handler: Handler,
  params_schema?: Schema<unknown>,
  body_schema?: Schema<unknown>,
  output_schema?: Schema<unknown>,
): PartialRoute {
  return {
    type: PartialRouteSymbol,
    method,
    handler,
    params_schema,
    body_schema,
    output_schema,
  };
}

/**
 * Type guard for PartialRoute.
 *
 * @since 0.1.0
 */
export function is_partial_route(value: unknown): value is PartialRoute {
  return Refinement.isRecord(value) &&
    "type" in value &&
    value.type === PartialRouteSymbol;
}

/**
 * Function type for building partial routes from handlers.
 *
 * @since 0.2.0
 */
export type MethodBuilder = {
  (handler: Handler): PartialRoute;
  <P, B = unknown, O = unknown>(
    config: PartialRouteConfig<P, B, O>,
  ): PartialRoute;
};

function is_config<P, B, O>(
  input: Handler | PartialRouteConfig<P, B, O>,
): input is PartialRouteConfig<P, B, O> {
  return Refinement.isRecord(input) && "handler" in input &&
    ("params" in input || "body" in input || "output" in input);
}

function create_method_builder(method: Methods): MethodBuilder {
  function builder(handler: Handler): PartialRoute;
  function builder<P, B, O>(config: PartialRouteConfig<P, B, O>): PartialRoute;
  function builder<P, B, O>(
    input: Handler | PartialRouteConfig<P, B, O>,
  ): PartialRoute {
    if (is_config(input)) {
      return {
        type: PartialRouteSymbol,
        method,
        handler: input.handler as unknown as Handler,
        params_schema: input.params as Schema<unknown> | undefined,
        body_schema: input.body as Schema<unknown> | undefined,
        output_schema: input.output as Schema<unknown> | undefined,
        schema_handler: input.handler as SchemaHandler,
      };
    }
    return partial_route(method, input);
  }
  return builder;
}

/**
 * Creates a GET route handler.
 *
 * @example
 * ```ts
 * export const get_users = B.get((req, params, ctx) => R.text("Hello"));
 * export const get_user = B.get({
 *   params: schema(s => s.struct({ id: s.string() })),
 *   handler: (req, params, body, ctx) => R.text(`ID: ${params.id}`),
 * });
 * ```
 *
 * @since 0.1.0
 */
export const get: MethodBuilder = create_method_builder("GET");

/**
 * Creates a POST route handler.
 *
 * @since 0.1.0
 */
export const post: MethodBuilder = create_method_builder("POST");

/**
 * Creates a PUT route handler.
 *
 * @since 0.1.0
 */
export const put: MethodBuilder = create_method_builder("PUT");

/**
 * Creates a DELETE route handler.
 *
 * @since 0.1.0
 */
export const del: MethodBuilder = create_method_builder("DELETE");

/**
 * Creates a PATCH route handler.
 *
 * @since 0.1.0
 */
export const patch: MethodBuilder = create_method_builder("PATCH");

/**
 * Creates a HEAD route handler.
 *
 * @since 0.1.0
 */
export const head: MethodBuilder = create_method_builder("HEAD");

/**
 * Creates an OPTIONS route handler.
 *
 * @since 0.1.0
 */
export const options: MethodBuilder = create_method_builder("OPTIONS");

const ClientPageSymbol = "CLIENT_PAGE" as const;
type ClientPageSymbol = typeof ClientPageSymbol;

/**
 * Marker type for client page routes.
 *
 * @since 0.3.0
 */
export type ClientPage<T extends string = string, P = unknown> = {
  readonly type: ClientPageSymbol;
  readonly tag: T;
  readonly component: FunctionComponent<P>;
};

// deno-lint-ignore no-explicit-any
type ClientPageFactory<T extends string, U = any> = {
  readonly create: <P extends U>(
    component: FunctionComponent<P>,
  ) => ClientPage<T, P>;
  readonly refine: (value: unknown) => value is ClientPage<T, unknown>;
};

// deno-lint-ignore no-explicit-any
function create_client_page<T extends string, U = any>(
  tag: T,
): ClientPageFactory<T, U> {
  return {
    create: <P extends U>(component: FunctionComponent<P>) => ({
      type: ClientPageSymbol,
      tag,
      component,
    }),
    refine: Refinement.struct({
      type: Refinement.literal(ClientPageSymbol),
      tag: Refinement.literal(tag),
      component: (c): c is FunctionComponent<unknown> =>
        typeof c === "function",
    }),
  };
}

/**
 * Factory for creating ClientRoute tagged pages.
 *
 * @since 0.3.0
 */
export const client_route: ClientPageFactory<"ClientRoute"> =
  create_client_page("ClientRoute");

/**
 * Factory for creating ClientDefaultRoute tagged pages.
 *
 * @since 0.3.0
 */
export const client_default: ClientPageFactory<"ClientDefaultRoute"> =
  create_client_page("ClientDefaultRoute");

/**
 * Parameters passed to ClientIndex components for rendering the HTML shell.
 *
 * @since 0.3.0
 */
export type ClientIndexParameters = {
  readonly scripts: readonly string[];
  readonly styles: readonly string[];
  readonly title: string;
};

/**
 * Factory for creating ClientIndex tagged pages.
 *
 * @since 0.3.0
 */
export const client_index: ClientPageFactory<
  "ClientIndex",
  ClientIndexParameters
> = create_client_page("ClientIndex");

/**
 * Parameters passed to ClientWrapper components for wrapping the SPA router.
 *
 * @since 0.3.0
 */
export type ClientWrapperParameters = {
  readonly children: ComponentChildren;
};

/**
 * Factory for creating ClientWrapper tagged pages.
 *
 * @since 0.3.0
 */
export const client_wrapper: ClientPageFactory<
  "ClientWrapper",
  ClientWrapperParameters
> = create_client_page("ClientWrapper");
