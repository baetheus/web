import { assertEquals } from "@std/assert";
import * as Path from "@std/path";
import * as Either from "@baetheus/fun/either";
import * as Effect from "@baetheus/fun/effect";
import * as Option from "@baetheus/fun/option";

import * as RouteBuilder from "../builder.ts";
import { client_plugin } from "../plugin_client.ts";
import { createMockFilesystem } from "./builder.test.ts";

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
