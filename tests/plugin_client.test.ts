import { assertEquals } from "@std/assert";
import * as Path from "@std/path";
import * as Either from "@baetheus/fun/either";
import * as Effect from "@baetheus/fun/effect";
import * as Option from "@baetheus/fun/option";

import * as RouteBuilder from "../builder.ts";
import { client_plugin } from "../plugin_client.ts";
import { createMockFilesystem } from "./builder.test.ts";

function unsafe_import(path: string): Promise<unknown> {
  return import(path);
}

// ============================================================================
// client_plugin basic tests
// ============================================================================

Deno.test("client_plugin - has correct default name", () => {
  const plugin = client_plugin({});
  assertEquals(plugin.name, "DefaultClientPlugin");
});

Deno.test("client_plugin - uses custom name when provided", () => {
  const plugin = client_plugin({ name: "MyClientPlugin" });
  assertEquals(plugin.name, "MyClientPlugin");
});

Deno.test("client_plugin - process_file always returns empty routes", async () => {
  const plugin = client_plugin({ include_extensions: [".ts", ".tsx"] });

  const fileEntry = RouteBuilder.file_entry(
    Path.parse("/root/styles.css"),
    "/styles.css",
    Option.some("text/css"),
  );

  const config: RouteBuilder.BuildConfig = {
    root_path: "/root",
    fs: createMockFilesystem(),
    unsafe_import,
    plugins: [plugin],
  };

  const either = await Effect.evaluate(config)(plugin.process_file(fileEntry));
  assertEquals(Either.isRight(either), true);
  if (!Either.isRight(either)) return;
  assertEquals(either.right.length, 0);
});
