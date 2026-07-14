import { assertEquals } from "@std/assert";
import * as Path from "@std/path";
import * as Option from "@baetheus/fun/option";

import * as Builder from "../builder.ts";
import { server_plugin } from "../plugin_server.ts";
import { createMockFilesystem } from "./builder.test.ts";

// Get absolute path to fixtures directory
const FIXTURES_DIR = new URL("./fixtures", import.meta.url).pathname;

function unsafe_import(path: string): Promise<unknown> {
  return import(path);
}

// ============================================================================
// server_plugin tests
// ============================================================================

Deno.test("server_plugin - has correct default name", () => {
  const plugin = server_plugin({});
  assertEquals(plugin.name, "DefaultServerPlugin");
});

Deno.test("server_plugin - uses custom name when provided", () => {
  const plugin = server_plugin({ name: "MyServerPlugin" });
  assertEquals(plugin.name, "MyServerPlugin");
});

Deno.test("server_plugin - skips non-included extensions", async () => {
  const fs = createMockFilesystem();
  const plugin = server_plugin({ include_extensions: [".ts", ".tsx"] });

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

  assertEquals(result.length, 0);
});

Deno.test("server_plugin - process_build returns empty (no new routes)", async () => {
  const fs = createMockFilesystem();
  const plugin = server_plugin({});

  const existingRoutes: Builder.SiteRoutes = [
    Builder.full_route(
      "OtherPlugin",
      Path.parse("/other.ts"),
      {
        method: "GET",
        pathname: "/other",
        url_pattern: new URLPattern({ pathname: "/other" }),
        handler: () => new Response("OK"),
      },
    ),
  ];

  const config: Builder.BuildConfig = {
    root_path: FIXTURES_DIR,
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const result = await plugin.process_build(existingRoutes);

  assertEquals(result.length, 0);
});
