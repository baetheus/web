/**
 * Convenience builder for assembling a complete web application from plugins.
 *
 * The `site()` function wires together the client SPA plugin, server routes
 * plugin, static file plugin, and optional OpenAPI plugin, then returns a
 * ready-to-use `Deno.serve`-compatible request handler.
 *
 * @example Basic usage
 * ```ts
 * import { site } from "@tub/web/site";
 *
 * Deno.serve(await site({
 *   root_path: "./src/routes",
 *   site_name: "My Application",
 *   unsafe_import: (path) => import(path),
 * }));
 * ```
 *
 * @example With OpenAPI and custom middleware
 * ```ts
 * import { site } from "@tub/web/site";
 * import { middleware } from "@tub/web/router";
 *
 * const log = middleware((next) => async (req, params, ctx) => {
 *   ctx.logger.info(`${req.method} ${req.url}`);
 *   return next(req, params, ctx);
 * });
 *
 * Deno.serve(await site({
 *   root_path: "./src/routes",
 *   site_name: "My API",
 *   unsafe_import: (path) => import(path),
 *   middlewares: [log],
 *   client: false,
 *   openapi: { info: { title: "My API", version: "1.0.0" } },
 * }));
 * ```
 *
 * @module
 * @since 0.1.0
 */

import * as PluginClient from "./plugin_client.ts";
import * as PluginServer from "./plugin_server.ts";
import * as PluginStatic from "./plugin_static.ts";
import * as PluginOpenAPI from "./plugin_openapi.ts";
import * as Builder from "./builder.ts";
import * as Either from "@baetheus/fun/either";
import * as Router from "./router.ts";
import * as DenoFS from "./deno_fs.ts";

/**
 * Options for the `site()` convenience builder.
 *
 * @since 0.1.0
 */
export type SiteOptions<D> = {
  readonly root_path: string;
  readonly site_name: string;
  readonly unsafe_import: (path: string) => Promise<unknown>;
  readonly state: D;
  readonly middlewares?: Router.Middleware<unknown>[];
  /** Enable the client SPA plugin. Pass options or `false` to disable. Default: `true`. */
  readonly client?: boolean | PluginClient.ClientPluginOptions;
  /** Enable the server routes plugin. Pass options or `false` to disable. Default: `true`. */
  readonly server?: boolean | PluginServer.ServerPluginOptions;
  /** Enable the static files plugin. Pass options or `false` to disable. Default: `true`. */
  readonly static_files?: boolean | PluginStatic.StaticPluginOptions;
  /** Enable the OpenAPI spec plugin. Pass options or `false` to disable. Default: `false`. */
  readonly openapi?: boolean | PluginOpenAPI.OpenAPIPluginOptions;
};

/**
 * Builds a complete site handler by composing plugins and returning a
 * `Deno.serve`-compatible request handler.
 *
 * Plugins are applied in this order: client SPA → server routes → static files
 * → OpenAPI (if enabled). Each can be disabled by passing `false` or tuned by
 * passing an options object.
 *
 * @param options - Configuration for the site builder.
 * @returns A promise that resolves to a request handler ready for `Deno.serve`.
 *
 * @since 0.1.0
 */
export async function site<D>(
  options: SiteOptions<D>,
): Promise<Router.Router["handle"]> {
  const {
    root_path,
    site_name,
    unsafe_import,
    state,
    middlewares = [],
    client = true,
    server = true,
    static_files = true,
    openapi = false,
  } = options;

  const plugins: Builder.Plugin[] = [];

  if (client !== false) {
    const opts = client === true ? {} : client;
    plugins.push(PluginClient.client_plugin({ title: site_name, ...opts }));
  }

  if (server !== false) {
    const opts = server === true ? {} : server;
    plugins.push(PluginServer.server_plugin(opts));
  }

  if (static_files !== false) {
    const opts = static_files === true
      ? { exclude_extensions: [".ts", ".tsx"] }
      : static_files;
    plugins.push(PluginStatic.static_plugin(opts));
  }

  if (openapi !== false) {
    const opts = openapi === true
      ? { info: { title: site_name, version: "latest" } }
      : openapi;
    plugins.push(PluginOpenAPI.openapi_plugin(opts));
  }

  const result = await Builder.build({
    root_path,
    fs: DenoFS.deno_fs,
    unsafe_import,
    plugins,
  });

  if (Either.isLeft(result)) {
    throw result.left;
  }

  const router = Router.router(Router.context(state), {
    routes: result.right.site_routes.map((r) => r.route),
    middlewares,
  });

  return router.handle;
}
