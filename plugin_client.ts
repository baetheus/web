/**
 * Client SPA builder for preact-based single page applications.
 *
 * @module
 * @since 0.3.0
 */

import type { Style } from "./styles.ts";

import * as Path from "@std/path";
import * as Effect from "@baetheus/fun/effect";
import * as Refinement from "@baetheus/fun/refinement";
import { contentType } from "@std/media-types";
import { renderToString } from "preact-render-to-string";
import { h } from "preact";

import * as Css from "./styles.ts";
import * as RouteBuilder from "./builder.ts";
import * as Router from "./router.ts";
import * as Tokens from "./tokens.ts";
import { strip_extension } from "./_shared.ts";

/**
 * Configuration options for the client SPA plugin.
 *
 * @since 0.3.0
 */
export type ClientPluginOptions = {
  readonly name?: string;
  readonly title?: string;
  readonly include_extensions?: string[];
  readonly bundler_options?: Deno.bundle.Options;
};

type ClientRouteEntry<T extends string, P = unknown> = {
  readonly file_entry: RouteBuilder.FileEntry;
  readonly export_pair: [export_name: string, Tokens.ClientPage<T, P>];
};

type CssEntry = {
  readonly file_entry: RouteBuilder.FileEntry;
  readonly export_name: string;
  readonly css: Style;
};

type ClientPluginState = {
  routes: ClientRouteEntry<"ClientRoute">[];
  default_routes: ClientRouteEntry<"ClientDefaultRoute">[];
  wrappers: ClientRouteEntry<"ClientWrapper", Tokens.ClientWrapperParameters>[];
  indices: ClientRouteEntry<"ClientIndex", Tokens.ClientIndexParameters>[];
  css: CssEntry[];
};

const client_route_pair = Refinement.tuple(
  Refinement.string,
  Tokens.client_route.refine,
);
const client_default_pair = Refinement.tuple(
  Refinement.string,
  Tokens.client_default.refine,
);
const client_wrapper_pair = Refinement.tuple(
  Refinement.string,
  Tokens.client_wrapper.refine,
);
const client_index_pair = Refinement.tuple(
  Refinement.string,
  Tokens.client_index.refine,
);

function generate_default_html(
  scripts: readonly string[],
  styles: readonly string[],
  title: string,
): string {
  const styleLinks = styles
    .map((s) => `  <link rel="stylesheet" href="${s}">`)
    .join("\n");
  const scriptTags = scripts
    .map((s) => `  <script type="module" src="${s}"></script>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
${styleLinks}
</head>
<body>
  <div id="app"></div>
${scriptTags}
</body>
</html>`;
}

function generate_entrypoint_source(state: ClientPluginState): string {
  const lines: string[] = [
    `import { h, render, Fragment } from "preact";`,
    `import { LocationProvider, Router, Route, ErrorBoundary, lazy } from "preact-iso";`,
  ];

  if (state.wrappers.length > 0) {
    const wrapper = state.wrappers[0];
    lines.push(
      `import { ${wrapper.export_pair[0]} as WrapperModule } from ${
        JSON.stringify(wrapper.file_entry.absolute_path)
      };`,
    );
  }

  state.routes.forEach((route, index) => {
    lines.push(
      `const Route${index} = lazy(() => import(${
        JSON.stringify(route.file_entry.absolute_path)
      }).then(m => ({ default: m.${route.export_pair[0]}.component })));`,
    );
  });

  if (state.default_routes.length > 0) {
    const dr = state.default_routes[0];
    lines.push(
      `const DefaultRoute = lazy(() => import(${
        JSON.stringify(dr.file_entry.absolute_path)
      }).then(m => ({ default: m.${dr.export_pair[0]}.component })));`,
    );
  }

  const wrapperComponent = state.wrappers.length > 0
    ? "WrapperModule.component"
    : "Fragment";

  const routeElems = state.routes
    .map((r, i) =>
      `h(Route, { path: ${
        JSON.stringify(strip_extension(r.file_entry.relative_path))
      }, component: Route${i} })`
    )
    .join(", ");

  const defaultElem = state.default_routes.length > 0
    ? `, h(Route, { path: "/*", component: DefaultRoute, default: true })`
    : "";

  lines.push(
    `function App() { return h(${wrapperComponent}, null, h(LocationProvider, null, h(ErrorBoundary, null, h(Router, null, ${routeElems}${defaultElem})))); }`,
    `render(App(), document.body);`,
  );

  return lines.join("\n");
}

async function create_entrypoint(
  state: ClientPluginState,
  config: RouteBuilder.BuildConfig,
): Promise<string> {
  const tempFilePath = await config.fs.makeTempFile({
    prefix: "bundle-",
    suffix: ".ts",
  });
  const sourceText = generate_entrypoint_source(state);
  const encoder = new TextEncoder();
  const sourceBytes = encoder.encode(sourceText);
  await config.fs.write(Path.parse(tempFilePath), sourceBytes);
  return tempFilePath;
}

async function create_bundle_assets(
  entrypoint: string,
  client_config: Deno.bundle.Options,
): Promise<Map<string, Uint8Array>> {
  let results: Deno.bundle.Result;
  try {
    results = await Deno.bundle({
      ...client_config,
      entrypoints: [entrypoint],
      write: false,
    });
  } catch (err) {
    throw RouteBuilder.build_error("Deno.bundle threw an exception", {
      error: err,
    });
  }

  if (!results.success) {
    throw RouteBuilder.build_error("Deno.bundle returned errors", {
      entrypoint,
    });
  }

  const map = new Map<string, Uint8Array>();
  for (const file of results.outputFiles ?? []) {
    if (file.contents !== undefined) {
      map.set(
        file.path === "<stdout>" ? `bundle-${file.hash}.js` : file.path,
        file.contents,
      );
    }
  }
  return map;
}

async function create_css_asset(
  state: ClientPluginState,
  bundle_assets: Map<string, Uint8Array>,
): Promise<Map<string, Uint8Array>> {
  if (state.css.length === 0) {
    return bundle_assets;
  }

  const items = state.css.map((entry) => entry.css) as [Style, ...Style[]];
  const cssContent = Css.render(Css.join(...items), Css.MINIMAL_RENDER_OPTIONS);
  const encoder = new TextEncoder();
  const cssBytes = encoder.encode(cssContent);

  const hashBuffer = await crypto.subtle.digest("SHA-256", cssBytes);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 8);
  const cssFileName = `styles-${hashHex}.css`;

  bundle_assets.set(cssFileName, cssBytes);
  return bundle_assets;
}

function create_index_handler(
  bundle_assets: Map<string, Uint8Array>,
  state: ClientPluginState,
  title: string,
): Router.Handler {
  const assets = Array.from(bundle_assets.keys());
  const scripts = assets.filter((path) => path.endsWith(".js"));
  const styles = assets.filter((path) => path.endsWith(".css"));
  let html_content: string;

  if (state.indices.length > 0) {
    const index = state.indices[0];
    const IndexComponent = index.export_pair[1].component;
    html_content = renderToString(
      h(IndexComponent, { title, scripts, styles }),
    );
  } else {
    html_content = generate_default_html(scripts, styles, title);
  }

  return () => Router.html(html_content);
}

function create_routes(
  config: RouteBuilder.BuildConfig,
  index_handler: Router.Handler,
  state: ClientPluginState,
  bundle_assets: Map<string, Uint8Array>,
  plugin_name: string,
): RouteBuilder.FullRoute[] {
  const routes: RouteBuilder.FullRoute[] = [];

  routes.push(
    RouteBuilder.full_route(
      plugin_name,
      Path.parse(config.root_path),
      Router.route("GET", "/", index_handler),
    ),
  );

  for (const route of state.routes) {
    routes.push(
      RouteBuilder.full_route(
        plugin_name,
        route.file_entry.parsed_path,
        Router.route(
          "GET",
          strip_extension(route.file_entry.relative_path),
          index_handler,
        ),
      ),
    );
  }

  for (const [assetPath, contents] of bundle_assets) {
    const parsed_path = Path.parse(Path.normalize(assetPath));
    const mimeType = contentType(parsed_path.ext);
    const assetBytes = new Uint8Array(contents);
    const asset_handler: Router.Handler = () =>
      Router.response(
        assetBytes,
        Router.response_init(
          Router.STATUS_CODE.OK,
          mimeType ? [[Router.HEADER.ContentType, mimeType]] : [],
        ),
      );

    routes.push(
      RouteBuilder.full_route(
        plugin_name,
        Path.parse(assetPath),
        Router.route("GET", assetPath, asset_handler),
      ),
    );
  }

  return routes;
}

/**
 * Creates a client SPA plugin that processes preact components and generates
 * a bundled single-page application with client-side routing.
 *
 * All file scanning and bundling is deferred to `process_build`, which
 * re-walks the directory to discover client exports fresh on every build.
 *
 * @example
 * ```ts
 * import { client_plugin } from "@baetheus/pick/plugin_client";
 *
 * const plugin = client_plugin({
 *   title: "My Application",
 *   include_extensions: [".tsx"],
 * });
 * ```
 *
 * @since 0.3.0
 */
export function client_plugin(
  _client_config: ClientPluginOptions = {},
): RouteBuilder.Plugin {
  const client_config = {
    name: "DefaultClientPlugin",
    title: "My Site",
    include_extensions: [".ts", ".tsx"],
    ..._client_config,
  };

  return {
    name: client_config.name,
    process_file: (_file_entry) => Effect.right([]),
    process_build: (_routes) =>
      Effect.tryCatch(
        async (config) => {
          const state: ClientPluginState = {
            routes: [],
            default_routes: [],
            wrappers: [],
            indices: [],
            css: [],
          };

          const file_entries = await config.fs.walk(config.root_path);

          for (const file_entry of file_entries) {
            if (
              !client_config.include_extensions.includes(
                file_entry.parsed_path.ext,
              )
            ) {
              continue;
            }

            let raw_import: unknown;
            try {
              raw_import = await config.unsafe_import(
                "file://" + Path.format(file_entry.parsed_path),
              );
            } catch {
              continue;
            }

            if (!Refinement.isRecord(raw_import)) continue;

            for (const export_pair of Object.entries(raw_import)) {
              if (client_route_pair(export_pair)) {
                state.routes.push({ file_entry, export_pair });
              } else if (client_default_pair(export_pair)) {
                state.default_routes.push({ file_entry, export_pair });
              } else if (client_wrapper_pair(export_pair)) {
                state.wrappers.push({ file_entry, export_pair });
              } else if (client_index_pair(export_pair)) {
                state.indices.push({ file_entry, export_pair });
              } else if (Css.hasStyles(export_pair[1])) {
                state.css.push({
                  file_entry,
                  export_name: export_pair[0],
                  css: export_pair[1],
                });
              }
            }
          }

          if (state.default_routes.length > 1) {
            throw RouteBuilder.build_error(
              "Client plugin supports a maximum of 1 default route",
            );
          }
          if (state.wrappers.length > 1) {
            throw RouteBuilder.build_error(
              "Client plugin supports a maximum of 1 application wrapper",
            );
          }
          if (state.indices.length > 1) {
            throw RouteBuilder.build_error(
              "Client plugin supports a maximum of 1 index creator",
            );
          }

          const entrypoint = await create_entrypoint(state, config);
          const bundle_assets = await create_bundle_assets(entrypoint, {
            format: "esm",
            minify: true,
            codeSplitting: true,
            inlineImports: true,
            packages: "bundle",
            sourcemap: "linked",
            platform: "browser",
            ...client_config.bundler_options ?? {},
            outputDir: config.root_path,
            entrypoints: [entrypoint],
          });
          const bundle_assets_with_css = await create_css_asset(
            state,
            bundle_assets,
          );
          const index_handler = create_index_handler(
            bundle_assets_with_css,
            state,
            client_config.title,
          );

          return create_routes(
            config,
            index_handler,
            state,
            bundle_assets_with_css,
            client_config.name,
          );
        },
        (error) =>
          RouteBuilder.build_error("Client plugin build failed", { error }),
      ),
  };
}
