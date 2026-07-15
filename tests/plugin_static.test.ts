import { assertEquals } from "@std/assert";
import * as Path from "@std/path";
import * as Either from "@baetheus/fun/either";
import * as Effect from "@baetheus/fun/effect";
import * as Option from "@baetheus/fun/option";

import * as Builder from "../builder.ts";
import * as Router from "../router.ts";
import { static_plugin } from "../plugin_static.ts";
import { createMockFilesystem, mockFile } from "./builder.test.ts";

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
