import { assertEquals, assertNotEquals } from "@std/assert";
import { camelToKebab, type CssValue, djb2, hashObject } from "../_internal.ts";

// =============================================================================
// djb2 tests
// =============================================================================

Deno.test("djb2 - returns consistent hash for same input", () => {
  const hash1 = djb2("hello");
  const hash2 = djb2("hello");
  assertEquals(hash1, hash2);
});

Deno.test("djb2 - returns different hashes for different inputs", () => {
  const hash1 = djb2("hello");
  const hash2 = djb2("world");
  assertNotEquals(hash1, hash2);
});

Deno.test("djb2 - handles empty string", () => {
  const hash = djb2("");
  assertEquals(hash, 5381);
});

Deno.test("djb2 - returns unsigned 32-bit integer", () => {
  const hash = djb2("test string with some content");
  assertEquals(hash >= 0, true);
  assertEquals(hash <= 0xffffffff, true);
});

Deno.test("djb2 - handles special characters", () => {
  const hash1 = djb2("hello\nworld");
  const hash2 = djb2("hello\tworld");
  assertNotEquals(hash1, hash2);
});

Deno.test("djb2 - handles unicode", () => {
  const hash = djb2("日本語テスト");
  assertEquals(typeof hash, "number");
  assertEquals(hash >= 0, true);
});

// =============================================================================
// hashObject tests
// =============================================================================

Deno.test("hashObject - returns 8 character string", () => {
  const hash = hashObject({ color: "red" });
  assertEquals(hash.length, 8);
});

Deno.test("hashObject - returns consistent hash for same object", () => {
  const hash1 = hashObject({ color: "red", size: 10 });
  const hash2 = hashObject({ color: "red", size: 10 });
  assertEquals(hash1, hash2);
});

Deno.test("hashObject - returns different hashes for different objects", () => {
  const hash1 = hashObject({ color: "red" });
  const hash2 = hashObject({ color: "blue" });
  assertNotEquals(hash1, hash2);
});

Deno.test("hashObject - handles arrays", () => {
  const hash1 = hashObject([1, 2, 3]);
  const hash2 = hashObject([1, 2, 3]);
  const hash3 = hashObject([3, 2, 1]);
  assertEquals(hash1, hash2);
  assertNotEquals(hash1, hash3);
});

Deno.test("hashObject - handles strings", () => {
  const hash = hashObject("hello");
  assertEquals(hash.length, 8);
});

Deno.test("hashObject - handles numbers", () => {
  const hash = hashObject(42);
  assertEquals(hash.length, 8);
});

Deno.test("hashObject - handles nested objects", () => {
  const hash1 = hashObject({ a: { b: { c: 1 } } });
  const hash2 = hashObject({ a: { b: { c: 1 } } });
  assertEquals(hash1, hash2);
});

Deno.test("hashObject - handles null", () => {
  const hash = hashObject(null);
  assertEquals(hash.length, 8);
});

Deno.test("hashObject - handles boolean", () => {
  const hash1 = hashObject(true);
  const hash2 = hashObject(false);
  assertNotEquals(hash1, hash2);
});

Deno.test("hashObject - zero-pads short hashes", () => {
  // Empty object should still produce 8-char hash
  const hash = hashObject({});
  assertEquals(hash.length, 8);
});

// =============================================================================
// camelToKebab tests
// =============================================================================

Deno.test("camelToKebab - converts single uppercase", () => {
  assertEquals(camelToKebab("backgroundColor"), "background-color");
});

Deno.test("camelToKebab - converts multiple uppercase letters", () => {
  assertEquals(camelToKebab("borderTopWidth"), "border-top-width");
});

Deno.test("camelToKebab - handles leading lowercase", () => {
  assertEquals(camelToKebab("fontSize"), "font-size");
});

Deno.test("camelToKebab - handles all lowercase", () => {
  assertEquals(camelToKebab("color"), "color");
});

Deno.test("camelToKebab - handles empty string", () => {
  assertEquals(camelToKebab(""), "");
});

Deno.test("camelToKebab - handles consecutive uppercase", () => {
  assertEquals(camelToKebab("msTransform"), "ms-transform");
});

Deno.test("camelToKebab - handles WebkitTransform style names", () => {
  assertEquals(camelToKebab("WebkitTransform"), "-webkit-transform");
});

// =============================================================================
// CssValue type tests (compile-time checks)
// =============================================================================

Deno.test("CssValue - accepts string values", () => {
  const value: CssValue = "red";
  assertEquals(value, "red");
});

Deno.test("CssValue - accepts number values", () => {
  const value: CssValue = 16;
  assertEquals(value, 16);
});
