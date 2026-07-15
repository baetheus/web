import { assertEquals } from "@std/assert";
import * as Path from "@std/path";
import * as Either from "@baetheus/fun/either";
import * as Effect from "@baetheus/fun/effect";
import * as Option from "@baetheus/fun/option";

import * as Builder from "../builder.ts";
import * as Router from "../router.ts";
import { server_plugin } from "../plugin_server.ts";
import { createMockFilesystem } from "./builder.test.ts";

// Get absolute path to fixtures directory
const FIXTURES_DIR = new URL("./fixtures", import.meta.url).pathname;

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
