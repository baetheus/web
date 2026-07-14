import type { StatusCode, StatusText } from "./status.ts";
import type { Header } from "./unstable-header.ts";

import { HEADER } from "./unstable-header.ts";
import { STATUS_CODE, STATUS_TEXT } from "./status.ts";

/**
 * HTTP header constants re-exported from Deno's standard library.
 *
 * @example
 * ```ts
 * import { HEADER } from "./router.ts";
 * const headers = new Headers();
 * headers.set(HEADER.ContentType, "application/json");
 * ```
 *
 * @since 0.1.0
 */
export { HEADER };

/**
 * HTTP status code constants re-exported from Deno's standard library.
 *
 * @example
 * ```ts
 * import { STATUS_CODE, response_init } from "./router.ts";
 * const notFoundInit = response_init(STATUS_CODE.NotFound);
 * ```
 *
 * @since 0.1.0
 */
export { STATUS_CODE };

/**
 * HTTP status text constants re-exported from Deno's standard library.
 *
 * @example
 * ```ts
 * import { STATUS_TEXT, STATUS_CODE } from "./router.ts";
 * console.log(STATUS_TEXT[STATUS_CODE.OK]); // "OK"
 * ```
 *
 * @since 0.1.0
 */
export { STATUS_TEXT };

/**
 * Creates a ResponseInit object with the specified status, headers, and status text.
 *
 * @example
 * ```ts
 * import { response_init, STATUS_CODE, HEADER } from "./router.ts";
 * const init = response_init(STATUS_CODE.NotFound);
 * const initWithHeaders = response_init(
 *   STATUS_CODE.OK,
 *   [[HEADER.ContentType, "application/json"]]
 * );
 * ```
 *
 * @since 0.1.0
 */
export function response_init(
  status: StatusCode,
  headers: HeadersInit = [],
  statusText: StatusText = STATUS_TEXT[status],
): ResponseInit {
  return { status, statusText, headers };
}

/**
 * Creates a new Response with the given body and response initialization options.
 *
 * @example
 * ```ts
 * import { response, response_init, STATUS_CODE } from "./router.ts";
 * const okResponse = response("Hello World");
 * const notFoundResponse = response("Not Found", response_init(STATUS_CODE.NotFound));
 * ```
 *
 * @since 0.1.0
 */
export function response(
  body: BodyInit,
  res: ResponseInit = response_init(STATUS_CODE.OK),
): Response {
  return new Response(body, res);
}

/**
 * Creates an HTML response with the appropriate Content-Type header.
 *
 * @example
 * ```ts
 * import { html, STATUS_CODE } from "./router.ts";
 * const homePage = html("<h1>Welcome!</h1>");
 * const errorPage = html("<h1>Not Found</h1>", STATUS_CODE.NotFound);
 * ```
 *
 * @since 0.1.0
 */
export function html(
  content: BodyInit,
  status: StatusCode = STATUS_CODE.OK,
): Response {
  return response(
    content,
    response_init(status, [[HEADER.ContentType, "text/html; charset=utf-8"]]),
  );
}

/**
 * Creates a JSON response with the appropriate Content-Type header.
 *
 * @example
 * ```ts
 * import { json, STATUS_CODE } from "./router.ts";
 * const userResponse = json(JSON.stringify({ id: 1 }));
 * ```
 *
 * @since 0.1.0
 */
export function json(
  content: BodyInit,
  status: StatusCode = STATUS_CODE.OK,
): Response {
  return response(
    content,
    response_init(status, [[
      HEADER.ContentType,
      "application/json; charset=utf-8",
    ]]),
  );
}

/**
 * Creates a plain text response.
 *
 * @example
 * ```ts
 * import { text, STATUS_CODE } from "./router.ts";
 * const greeting = text("Hello, World!");
 * const error = text("Something went wrong", STATUS_CODE.InternalServerError);
 * ```
 *
 * @since 0.1.0
 */
export function text(
  content: BodyInit,
  status: StatusCode = STATUS_CODE.OK,
): Response {
  return response(content, response_init(status));
}

/**
 * Creates a function that modifies headers on a Response object.
 *
 * @example
 * ```ts
 * import { modify_header, text, HEADER } from "./router.ts";
 * const addCacheControl = modify_header((headers) => {
 *   headers.set(HEADER.CacheControl, "max-age=3600");
 * });
 * const response = addCacheControl(text("Cached content"));
 * ```
 *
 * @since 0.1.0
 */
export function modify_header(
  modify_fn: (h: Headers) => void,
): (res: Response) => Response {
  return (res) => {
    modify_fn(res.headers);
    return res;
  };
}

/**
 * A tuple representing a single HTTP header as a key-value pair.
 *
 * @since 0.1.0
 */
export type HeaderPair = [header: Header, value: string];

/**
 * A tuple of one or more HeaderPair tuples for batch header operations.
 *
 * @since 0.1.0
 */
export type HeaderPairs = [HeaderPair, ...HeaderPair[]];

/**
 * Creates a function that sets multiple headers on a Response object.
 *
 * @since 0.1.0
 */
export function set_headers(
  ...pairs: HeaderPairs
): (res: Response) => Response {
  return modify_header((headers) =>
    pairs.forEach(([header, value]) => headers.set(header, value))
  );
}

/**
 * Creates a function that appends multiple headers to a Response object.
 *
 * @since 0.1.0
 */
export function append_header(
  ...pairs: HeaderPairs
): (res: Response) => Response {
  return modify_header((headers) =>
    pairs.forEach(([header, value]) => headers.append(header, value))
  );
}

/**
 * Creates a function that deletes multiple headers from a Response object.
 *
 * @since 0.1.0
 */
export function delete_header(
  ...keys: [Header, ...Header[]]
): (res: Response) => Response {
  return modify_header((headers) => keys.forEach((key) => headers.delete(key)));
}

/**
 * A comprehensive collection of standard HTTP methods supported by the router.
 *
 * @example
 * ```ts
 * import { METHODS } from "@baetheus/pick/router";
 * console.log(METHODS.GET);    // "GET"
 * console.log(METHODS.POST);   // "POST"
 * ```
 *
 * @since 0.1.0
 */
export const METHODS = {
  "CONNECT": "CONNECT",
  "DELETE": "DELETE",
  "GET": "GET",
  "HEAD": "HEAD",
  "OPTIONS": "OPTIONS",
  "PATCH": "PATCH",
  "POST": "POST",
  "PUT": "PUT",
  "TRACE": "TRACE",
} as const;

/**
 * A type representing all valid HTTP methods supported by the router.
 *
 * @since 0.1.0
 */
export type Methods = keyof typeof METHODS;

/**
 * The shape of path parameters extracted from a matched URL pattern.
 * Named params are strings; wildcard segments (`*`) are readonly string arrays.
 *
 * @since 0.1.0
 */
export type Params = { readonly [key: string]: string | readonly string[] };

/**
 * Parses a URL path pattern into a structured type representing the path parameters.
 *
 * @example
 * ```ts
 * import type { ParsePath } from "@baetheus/pick/router";
 * type UserParams = ParsePath<"GET /users/:id">; // { id: string }
 * type WildcardParams = ParsePath<"GET /files/*">; // { "0": readonly string[] }
 * ```
 *
 * @since 0.1.0
 */
export type ParsePath<
  P extends string,
  // deno-lint-ignore ban-types
  R extends Record<string, string> = {},
> = P extends `${Methods} /${infer Part}` ? ParsePath<Part>
  : P extends `:${infer Key}/${infer Part}`
    ? ParsePath<Part, R & { [K in Key]: string }>
  : P extends `*/${infer Part}`
    ? ParsePath<Part, R & { readonly "0": readonly string[] }>
  : P extends `${string}/${infer Part}` ? ParsePath<Part, R>
  : P extends `:${infer Key}` ? ParsePath<"", R & { [K in Key]: string }>
  : P extends `*` ? ParsePath<"", R & { readonly "0": readonly string[] }>
  : { readonly [K in keyof R]: R[K] };

/**
 * A template literal type representing a complete route definition string.
 *
 * @example
 * ```ts
 * import type { RouteString } from "./router.ts";
 * const getUsers: RouteString = "GET /api/users";
 * ```
 *
 * @since 0.1.0
 */
export type RouteString = `${Methods} /${string}`;

/**
 * Creates a properly typed route string from an HTTP method and path.
 *
 * @example
 * ```ts
 * import { route_string } from "./router.ts";
 * const userRoute = route_string("GET", "/users/:id");
 * ```
 *
 * @since 0.1.0
 */
export function route_string(method: Methods, path: string): RouteString {
  return `${method} /${path}` as RouteString;
}

/**
 * A function type for logging messages at various levels.
 *
 * @since 0.1.0
 */
// deno-lint-ignore no-explicit-any
export type LogFn = (...data: any[]) => void;

/**
 * An interface defining a complete logging system with multiple severity levels.
 *
 * @since 0.1.0
 */
export type Logger = {
  readonly fatal: LogFn;
  readonly error: LogFn;
  readonly warn: LogFn;
  readonly info: LogFn;
  readonly debug: LogFn;
  readonly trace: LogFn;
};

/**
 * A default logger implementation that uses the browser/Deno console methods.
 *
 * @since 0.1.0
 */
export const DEFAULT_LOGGER: Logger = {
  fatal: console.error,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
};

function noop(): void {}

/**
 * A logger implementation that silently discards all log messages.
 *
 * @since 0.1.0
 */
export const NOOP_LOGGER: Logger = {
  fatal: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
};

/**
 * The context object passed to route handlers.
 *
 * @example
 * ```ts
 * import type { Ctx } from "@baetheus/pick/router";
 * type AppState = { db: Database };
 * function handleRequest(req: Request, params: Params, ctx: Ctx<AppState>): Response {
 *   return new Response("OK");
 * }
 * ```
 *
 * @since 0.1.0
 */
export type Ctx<D = unknown> = {
  readonly logger: Logger;
  readonly state: D;
};

/**
 * Creates a context object for route handlers.
 *
 * @example
 * ```ts
 * import { context, router, handle } from "@baetheus/pick/router";
 * const ctx = context({ count: 0 });
 * const app = router(ctx, {
 *   routes: [handle("GET /", () => new Response("Hello"))]
 * });
 * ```
 *
 * @since 0.1.0
 */
export function context<D = unknown>(
  state: D,
  logger: Logger = DEFAULT_LOGGER,
): Ctx<D> {
  return { state, logger };
}

/**
 * A plain-function route handler type.
 *
 * @example
 * ```ts
 * import type { Handler } from "@baetheus/pick/router";
 * const myHandler: Handler<{ db: Database }> = async (req, params, ctx) => {
 *   return new Response("Hello from handler");
 * };
 * ```
 *
 * @since 0.1.0
 */
export type Handler<D = unknown, P = Params> = (
  req: Request,
  params: P,
  ctx: Ctx<D>,
) => Response | Promise<Response>;

/**
 * Represents a complete route definition in the router system.
 *
 * @since 0.1.0
 */
export type Route<D = unknown> = {
  readonly method: Methods;
  readonly pathname: string;
  readonly url_pattern: URLPattern;
  readonly handler: Handler<D>;
};

/**
 * A type alias for routes with untyped or unknown state.
 *
 * @since 0.1.0
 */
// deno-lint-ignore no-explicit-any
export type AnyRoute = Route<any>;

function extract_params(
  pattern_result: URLPatternResult,
): Params {
  const groups = pattern_result.pathname.groups;
  const params: Record<string, string | readonly string[]> = {};
  for (const [key, value] of Object.entries(groups)) {
    if (key === "0") {
      params[key] = value ? value.split("/") : [];
    } else {
      params[key] = value ?? "";
    }
  }
  return params;
}

/**
 * Creates a route definition from method, path, and handler function.
 *
 * @example
 * ```ts
 * import { route } from "./router.ts";
 * const userRoute = route("GET", "/users/:id", (req, params, ctx) =>
 *   new Response(`User: ${params.id}`)
 * );
 * ```
 *
 * @since 0.1.0
 */
export function route<D>(
  method: Methods,
  path: string,
  handler: Handler<D>,
): Route<D> {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  return {
    method,
    pathname,
    handler,
    url_pattern: new URLPattern({ pathname }),
  };
}

/**
 * Creates a route from a route string and handler function with type-safe path params.
 *
 * @example
 * ```ts
 * import { handle } from "./router.ts";
 *
 * const homeRoute = handle("GET /", () => new Response("Welcome home!"));
 *
 * const userRoute = handle("GET /users/:id", (_, params) =>
 *   new Response(`User ID: ${params.id}`)
 * );
 *
 * const fileRoute = handle("GET /files/*", (_, params) => {
 *   const segments = params["0"] as readonly string[];
 *   return new Response(`File: ${segments.join('/')}`);
 * });
 * ```
 *
 * @since 0.1.0
 */
export function handle<D, R extends RouteString>(
  route_string: R,
  handler: (
    request: Request,
    path: ParsePath<R>,
    ctx: Ctx<D>,
  ) => Response | Promise<Response>,
): Route<D> {
  const [method, path_name] = route_string.split(" ") as [Methods, string];
  return route(
    method,
    path_name,
    handler as Handler<D>,
  );
}

/**
 * A function type that transforms route handlers to add cross-cutting concerns.
 *
 * @example
 * ```ts
 * import type { Middleware } from "./router.ts";
 *
 * const loggingMiddleware: Middleware<unknown> = (next) =>
 *   async (req, params, ctx) => {
 *     ctx.logger.info(`Request: ${req.method} ${req.url}`);
 *     const res = await next(req, params, ctx);
 *     ctx.logger.info(`Response: ${res.status}`);
 *     return res;
 *   };
 * ```
 *
 * @since 0.1.0
 */
export type Middleware<D> = (next: Handler<D>) => Handler<D>;

/**
 * A utility function for creating middleware with explicit type annotations.
 *
 * @example
 * ```ts
 * import { middleware } from "./router.ts";
 * const typedMiddleware = middleware<{ user?: string }>((next) =>
 *   async (req, params, ctx) => next(req, params, ctx)
 * );
 * ```
 *
 * @since 0.1.0
 */
export function middleware<D>(m: Middleware<D>): Middleware<D> {
  return m;
}

/**
 * The main router interface that manages route registration and request handling.
 *
 * @since 0.1.0
 */
export type Router = {
  handle(request: Request): Response | Promise<Response>;
};

/**
 * Configuration options for creating a router instance.
 *
 * @since 0.1.0
 */
export type RouterConfig<D> = {
  readonly routes: readonly Route<D>[];
  readonly middlewares: readonly Middleware<D>[];
  readonly default_handler: (req: Request) => Response | Promise<Response>;
};

function is_static(pathname: string): boolean {
  return !pathname.includes(":") && !pathname.includes("*");
}

function segment_count(pathname: string): number {
  return pathname.split("/").length;
}

function sort_routes<D>(routes: Route<D>[]): void {
  routes.sort((a, b) => {
    const a_static = is_static(a.pathname);
    const b_static = is_static(b.pathname);
    if (a_static !== b_static) return a_static ? -1 : 1;
    return segment_count(b.pathname) - segment_count(a.pathname);
  });
}

/**
 * Creates a new router instance with the specified shared state and initial routes.
 *
 * @example
 * ```ts
 * import { router, handle, context, STATUS_CODE, text } from "./router.ts";
 *
 * const appRouter = router(context({}), {
 *   routes: [
 *     handle("GET /", () => new Response("Welcome!")),
 *     handle("GET /users/:id", (_, params) => new Response(`User: ${params.id}`)),
 *   ]
 * });
 *
 * Deno.serve(appRouter.handle);
 * ```
 *
 * @since 0.1.0
 */
export function router<D>(
  ctx: Ctx<D>,
  {
    routes = [],
    middlewares = [],
    default_handler = () => text("Not Found", STATUS_CODE.NotFound),
  }: Partial<RouterConfig<D>>,
): Router {
  const apply_middleware = (h: Handler<D>): Handler<D> =>
    middlewares.reduce((acc, mw) => mw(acc), h);

  const route_map = new Map<string, Route<D>[]>();
  for (const r of routes) {
    const wrapped: Route<D> = {
      ...r,
      handler: apply_middleware(r.handler),
    };
    const bucket = route_map.get(r.method) ?? [];
    bucket.push(wrapped);
    route_map.set(r.method, bucket);
  }
  for (const bucket of route_map.values()) {
    sort_routes(bucket);
  }

  const wrapped_default = apply_middleware(
    (_req, _params, _ctx) => default_handler(_req),
  );

  return {
    async handle(request) {
      try {
        const method = request.method.toUpperCase();
        const routes = route_map.get(method) ?? [];
        for (const r of routes) {
          const pattern_result = r.url_pattern.exec(request.url);
          if (pattern_result !== null) {
            const params = extract_params(pattern_result);
            return await r.handler(request, params, ctx);
          }
        }
        return await wrapped_default(request, {}, ctx);
      } catch (e) {
        ctx.logger.fatal(e);
        return text("Internal Server Error", STATUS_CODE.InternalServerError);
      }
    },
  };
}
