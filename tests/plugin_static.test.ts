import { assertEquals } from "@std/assert";
import * as Path from "@std/path";
import * as Option from "@beatheus/fun/option";

import * as Builder from "../builder.ts";
import * as Router from "../router.ts";
import { static_plugin } from "../plugin_static.ts";
import { createMockFilesystem, mockFile } from "./builder.test.ts";

function unsafe_import(path: string): Promise<unknown> {
  return import(path);
}

// ============================================================================
// static_plugin tests
// ============================================================================

Deno.test("static_plugin - has correct default name", () => {
  const plugin = static_plugin({});
  assertEquals(plugin.name, "DefaultStaticPlugin");
});

Deno.test("static_plugin - uses custom name when provided", () => {
  const plugin = static_plugin({ name: "MyStaticPlugin" });
  assertEquals(plugin.name, "MyStaticPlugin");
});

Deno.test("static_plugin - creates route for file", async () => {
  const fs = createMockFilesystem({
    "/root/styles.css": mockFile("body { color: red; }", "text/css"),
  });

  const plugin = static_plugin({});
  const fileEntry = Builder.file_entry(
    Path.parse("/root/styles.css"),
    "/styles.css",
    Option.some("text/css"),
  );

  const config: Builder.BuildConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const result = await plugin.process_file(fileEntry);

  assertEquals(result[0].route.method, "GET");
  assertEquals(result[0].route.pathname, "/styles.css");
});

Deno.test("static_plugin - excludes files with excluded extensions", async () => {
  const fs = createMockFilesystem({
    "/root/script.ts": mockFile("export const x = 1"),
  });

  const plugin = static_plugin({ exclude_extensions: [".ts"] });
  const fileEntry = Builder.file_entry(
    Path.parse("/root/script.ts"),
    "/script.ts",
    undefined,
  );

  const config: Builder.BuilderConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const state = plugin.init();
  const result = await plugin.process_file(state, fileEntry, config);

  assertEquals(result.length, 0);
});

Deno.test("static_plugin - process_build returns empty (no new routes)", async () => {
  const fs = createMockFilesystem();
  const plugin = static_plugin({});

  const existingRoutes: Builder.SiteRoutes = [
    Builder.full_route(
      "OtherPlugin",
      Path.parse("/other/route.ts"),
      {
        method: "GET",
        pathname: "/other",
        url_pattern: new URLPattern({ pathname: "/other" }),
        handler: () => new Response("OK"),
      },
    ),
  ];

  const config: Builder.BuilderConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const state = plugin.init();
  const result = await plugin.process_build(state, existingRoutes, config);

  assertEquals(result.length, 0);
});

Deno.test("static_plugin - route handler reads file content", async () => {
  const fileContent = "body { background: blue; }";
  const fs = createMockFilesystem({
    "/root/styles.css": mockFile(fileContent, "text/css"),
  });

  const plugin = static_plugin({});
  const fileEntry = Builder.file_entry(
    Path.parse("/root/styles.css"),
    "/styles.css",
    "text/css",
  );

  const config: Builder.BuilderConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const state = plugin.init();
  const routes = await plugin.process_file(state, fileEntry, config);

  assertEquals(routes.length, 1);
  const r = routes[0];
  const req = new Request("http://localhost/styles.css");
  const ctx = Router.context({});

  const response = await r.route.handler(req, {}, ctx);

  const body = await response.text();
  assertEquals(body, fileContent);
  assertEquals(response.headers.get("Content-Type"), "text/css");
});

Deno.test("static_plugin - sets Content-Type header from mime_type", async () => {
  const fs = createMockFilesystem({
    "/root/image.png": mockFile(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
      "image/png",
    ),
  });

  const plugin = static_plugin({});
  const fileEntry = Builder.file_entry(
    Path.parse("/root/image.png"),
    "/image.png",
    "image/png",
  );

  const config: Builder.BuilderConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const state = plugin.init();
  const routes = await plugin.process_file(state, fileEntry, config);

  assertEquals(routes.length, 1);
  const req = new Request("http://localhost/image.png");
  const ctx = Router.context({});

  const response = await routes[0].route.handler(req, {}, ctx);
  assertEquals(response.headers.get("Content-Type"), "image/png");
});

Deno.test("static_plugin - handles files without mime_type", async () => {
  const fs = createMockFilesystem({
    "/root/unknown.xyz": mockFile("data"),
  });

  const plugin = static_plugin({});
  const fileEntry = Builder.file_entry(
    Path.parse("/root/unknown.xyz"),
    "/unknown.xyz",
    undefined,
  );

  const config: Builder.BuilderConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const state = plugin.init();
  const routes = await plugin.process_file(state, fileEntry, config);

  assertEquals(routes.length, 1);
  assertEquals(routes[0].route.pathname, "/unknown.xyz");
});

Deno.test("static_plugin - multiple exclude extensions", async () => {
  const fs = createMockFilesystem({
    "/root/script.ts": mockFile("export const x = 1"),
    "/root/test.tsx": mockFile("export const y = 2"),
    "/root/styles.css": mockFile("body {}"),
  });

  const plugin = static_plugin({ exclude_extensions: [".ts", ".tsx"] });

  const tsEntry = Builder.file_entry(
    Path.parse("/root/script.ts"),
    "/script.ts",
    undefined,
  );
  const tsxEntry = Builder.file_entry(
    Path.parse("/root/test.tsx"),
    "/test.tsx",
    undefined,
  );
  const cssEntry = Builder.file_entry(
    Path.parse("/root/styles.css"),
    "/styles.css",
    "text/css",
  );

  const config: Builder.BuilderConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const state = plugin.init();
  const tsResult = await plugin.process_file(state, tsEntry, config);
  const tsxResult = await plugin.process_file(state, tsxEntry, config);
  const cssResult = await plugin.process_file(state, cssEntry, config);

  assertEquals(tsResult.length, 0);
  assertEquals(tsxResult.length, 0);
  assertEquals(cssResult.length, 1);
});

Deno.test("static_plugin - integration with route_builder", async () => {
  const fs = createMockFilesystem({
    "/root/index.html": mockFile("<html></html>", "text/html"),
    "/root/styles/main.css": mockFile("body {}", "text/css"),
    "/root/scripts/app.ts": mockFile("export const x = 1"),
  });

  const plugin = static_plugin({ exclude_extensions: [".ts"] });

  const config: Builder.BuildCOnfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const result = await Builder.build(config);

  assertEquals(result.site_routes.length, 2);
  const pathnames = result.site_routes.map((r) => r.route.pathname);
  assertEquals(pathnames.includes("/index.html"), true);
  assertEquals(pathnames.includes("/styles/main.css"), true);
  assertEquals(pathnames.includes("/scripts/app.ts"), false);
});
