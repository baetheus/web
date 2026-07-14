import { assertEquals, assertNotEquals } from "@std/assert";
import type { CssValue } from "../_internal.ts";
import {
  type DeepPartial,
  isTheme,
  type MapShape,
  theme,
  type ThemeShape,
  type VariableKey,
  type Variables,
  type VariableValue,
  walkShape,
} from "../themes.ts";
import { render, style } from "../styles.ts";

// =============================================================================
// walkShape tests
// =============================================================================

Deno.test("walkShape - transforms leaf values", () => {
  const shape = { a: "value1", b: "value2" };
  const result = walkShape(
    shape,
    (_: CssValue, path: string[]) => path.join("-"),
  );
  assertEquals(result, { a: "a", b: "b" });
});

Deno.test("walkShape - handles nested shapes", () => {
  const shape = { colors: { primary: "blue", secondary: "green" } };
  const result = walkShape(
    shape,
    (_: CssValue, path: string[]) => path.join("-"),
  );
  assertEquals(result, {
    colors: { primary: "colors-primary", secondary: "colors-secondary" },
  });
});

Deno.test("walkShape - handles deeply nested shapes", () => {
  const shape = { a: { b: { c: { d: "value" } } } };
  const result = walkShape(
    shape,
    (_: CssValue, path: string[]) => path.join("-"),
  );
  assertEquals(result, { a: { b: { c: { d: "a-b-c-d" } } } });
});

Deno.test("walkShape - passes value to callback", () => {
  const shape = { a: "original" };
  const result = walkShape(shape, (value: CssValue) => `${value}-modified`);
  assertEquals(result, { a: "original-modified" });
});

Deno.test("walkShape - handles mixed nesting levels", () => {
  const shape = { top: "value", nested: { inner: "value" } };
  const result = walkShape(shape, (_: CssValue, path: string[]) => path.length);
  assertEquals(result, { top: 1, nested: { inner: 2 } });
});

Deno.test("walkShape - handles number values", () => {
  const shape = { spacing: 8, nested: { size: 16 } };
  const result = walkShape(shape, (value: CssValue) => value);
  assertEquals(result, { spacing: 8, nested: { size: 16 } });
});

// =============================================================================
// theme factory tests
// =============================================================================

Deno.test("theme - creates var references from shape", () => {
  const colors = theme({ primary: "blue" });
  assertEquals(typeof colors.primary, "string");
  assertEquals(colors.primary.startsWith("var(--"), true);
});

Deno.test("theme - returns consistent results for same shape", () => {
  const theme1 = theme({ color: "red" });
  const theme2 = theme({ color: "red" });
  assertEquals(theme1.color, theme2.color);
});

Deno.test("theme - returns different results for different shapes", () => {
  const theme1 = theme({ a: "value" });
  const theme2 = theme({ b: "value" });
  assertNotEquals(theme1.a, theme2.b);
});

Deno.test("theme - handles nested shapes", () => {
  const colors = theme({
    colors: {
      primary: "blue",
      secondary: "green",
    },
  });
  assertEquals(typeof colors.colors.primary, "string");
  assertEquals(typeof colors.colors.secondary, "string");
});

Deno.test("theme - var references are enumerable but methods are not", () => {
  const colors = theme({ color: "blue" });
  const keys = Object.keys(colors);
  assertEquals(keys.includes("color"), true);
  // create method is non-enumerable for consistent hashing
  assertEquals(keys.includes("create"), false);
  // but create still exists and is callable
  assertEquals(typeof colors.create, "function");
});

Deno.test("theme - handles number values", () => {
  const spacing = theme({ unit: 8 });
  assertEquals(typeof spacing.unit, "string");
  assertEquals(spacing.unit.startsWith("var(--"), true);
});

Deno.test("theme - accepts custom hash parameter", () => {
  const colors = theme({ primary: "blue" }, "custom");
  assertEquals(colors.primary, "var(--custom-primary)");
});

// =============================================================================
// Theme class tests
// =============================================================================

Deno.test("Theme - can be created with theme function", () => {
  const colors = theme({ primary: "blue" });
  assertEquals(typeof colors.primary, "string");
  assertEquals(colors.primary.startsWith("var(--"), true);
});

Deno.test("Theme - passes to style and renders CSS custom properties", () => {
  const colors = theme({ color: "red" });
  const s = style(colors);
  const css = render(s);
  assertEquals(css.includes("--"), true);
  assertEquals(css.includes("red"), true);
});

Deno.test("Theme - passes to style with nested values", () => {
  const colors = theme({ colors: { primary: "blue", secondary: "green" } });
  const s = style(colors);
  const css = render(s);
  assertEquals(css.includes("blue"), true);
  assertEquals(css.includes("green"), true);
});

Deno.test("Theme - passes to style with number values", () => {
  const spacing = theme({ unit: 16 });
  const s = style(spacing);
  const css = render(s);
  assertEquals(css.includes("16"), true);
});

Deno.test("Theme - passes to style with deep nesting", () => {
  const t = theme({ a: { b: { c: "value" } } });
  const s = style(t);
  const css = render(s);
  assertEquals(css.includes("value"), true);
});

// =============================================================================
// create tests
// =============================================================================

Deno.test("create - creates new theme with merged values", () => {
  const colors = theme({ primary: "blue", secondary: "green" });
  const dark = colors.create({ primary: "white" }, { keepParentValues: true });

  // Should have same var references
  assertEquals(colors.primary, dark.primary);
  assertEquals(colors.secondary, dark.secondary);

  // But different underlying values when rendered
  const lightCss = render(style(colors));
  const darkCss = render(style(dark));
  assertEquals(lightCss.includes("blue"), true);
  assertEquals(darkCss.includes("white"), true);
  assertEquals(darkCss.includes("green"), true);
});

Deno.test("create - preserves hash across variants", () => {
  const colors = theme({ primary: "blue" });
  const dark = colors.create({ primary: "white" });

  // Same var reference means same hash
  assertEquals(colors.primary, dark.primary);
});

Deno.test("create - handles nested partial updates", () => {
  const t = theme({
    colors: {
      primary: "blue",
      secondary: "green",
    },
    spacing: "8px",
  });

  const dark = t.create(
    { colors: { primary: "white" } },
    { keepParentValues: true },
  );

  const css = render(style(dark));
  assertEquals(css.includes("white"), true);
  assertEquals(css.includes("green"), true);
  assertEquals(css.includes("8px"), true);
});

Deno.test("create - handles deeply nested partial updates", () => {
  const t = theme({
    a: {
      b: {
        c: "original",
        d: "unchanged",
      },
    },
  });

  const updated = t.create(
    { a: { b: { c: "modified" } } },
    { keepParentValues: true },
  );

  const css = render(style(updated));
  assertEquals(css.includes("modified"), true);
  assertEquals(css.includes("unchanged"), true);
});

Deno.test("create - returns a Theme instance", () => {
  const colors = theme({ primary: "blue" });
  const dark = colors.create({ primary: "white" });
  assertEquals(isTheme(dark), true);
});

Deno.test("create - chaining works", () => {
  const colors = theme({ primary: "blue", secondary: "green" });
  const v1 = colors.create({ primary: "red" }, { keepParentValues: true });
  const v2 = v1.create({ secondary: "yellow" }, { keepParentValues: true });

  const css = render(style(v2));
  assertEquals(css.includes("red"), true);
  assertEquals(css.includes("yellow"), true);
});

// =============================================================================
// isTheme tests
// =============================================================================

Deno.test("isTheme - returns true for themes", () => {
  const colors = theme({ color: "blue" });
  assertEquals(isTheme(colors), true);
});

Deno.test("isTheme - returns true for theme created objects", () => {
  const colors = theme({ color: "blue" });
  assertEquals(isTheme(colors), true);
});

Deno.test("isTheme - returns false for plain objects", () => {
  const obj = { color: "var(--test)" };
  assertEquals(isTheme(obj), false);
});

Deno.test("isTheme - returns false for null", () => {
  assertEquals(isTheme(null), false);
});

Deno.test("isTheme - returns false for undefined", () => {
  assertEquals(isTheme(undefined), false);
});

Deno.test("isTheme - returns false for primitives", () => {
  assertEquals(isTheme("string"), false);
  assertEquals(isTheme(123), false);
  assertEquals(isTheme(true), false);
});

Deno.test("isTheme - returns false for arrays", () => {
  assertEquals(isTheme([1, 2, 3]), false);
});

// =============================================================================
// Theme with style integration tests
// =============================================================================

Deno.test("theme with style - creates Style with CSS custom properties", () => {
  const colors = theme({ color: "blue" });
  const themeStyle = style(colors);
  assertEquals(typeof themeStyle.toString(), "string");
});

Deno.test("theme with style - renders correct CSS", () => {
  const colors = theme({ primary: "blue" });
  const themeStyle = style(colors);
  const css = render(themeStyle);
  assertEquals(css.includes("blue"), true);
  assertEquals(css.includes("--"), true);
});

Deno.test("theme with style - handles nested themes", () => {
  const colors = theme({ colors: { primary: "blue", secondary: "green" } });
  const themeStyle = style(colors);
  const css = render(themeStyle);
  assertEquals(css.includes("blue"), true);
  assertEquals(css.includes("green"), true);
});

Deno.test("theme with style - allows custom selectors", () => {
  const colors = theme({ color: "red" });
  const themeStyle = style(":root", colors);
  const css = render(themeStyle);
  assertEquals(css.includes(":root"), true);
  assertEquals(css.includes("red"), true);
});

Deno.test("theme with style - var references work in styles", () => {
  const colors = theme({ primary: "blue" });
  const button = style({ color: colors.primary });
  const css = render(button);
  assertEquals(css.includes("var(--"), true);
});

// =============================================================================
// Type verification tests
// =============================================================================

Deno.test("VariableKey - accepts custom property names", () => {
  const key1: VariableKey = "--primary-color";
  const key2: VariableKey = "--spacing";
  assertEquals(key1, "--primary-color");
  assertEquals(key2, "--spacing");
});

Deno.test("VariableValue - accepts var() references", () => {
  const ref1: VariableValue = "var(--primary)";
  const ref2: VariableValue = "var(--color, blue)";
  assertEquals(ref1, "var(--primary)");
  assertEquals(ref2, "var(--color, blue)");
});

Deno.test("Variables - accepts custom property records", () => {
  const vars: Variables = {
    "--primary": "blue",
    "--spacing": 8,
  };
  assertEquals(vars["--primary"], "blue");
  assertEquals(vars["--spacing"], 8);
});

Deno.test("ThemeShape - accepts CssValue leaf values", () => {
  const shape: ThemeShape = { a: "blue", b: { c: 8 } };
  assertEquals(shape.a, "blue");
});

Deno.test("MapShape - transforms ThemeShape leaves", () => {
  type TestShape = { readonly a: "blue"; readonly b: { readonly c: 8 } };
  type Mapped = MapShape<TestShape, string>;
  const mapped: Mapped = { a: "test", b: { c: "nested" } };
  assertEquals(mapped.a, "test");
  assertEquals(mapped.b.c, "nested");
});

Deno.test("DeepPartial - allows partial at any level", () => {
  type TestShape = { a: "blue"; b: { c: "red"; d: "green" } };
  const partial: DeepPartial<TestShape> = { b: { c: "white" } };
  assertEquals(partial.b?.c, "white");
  assertEquals(partial.a, undefined);
});

// =============================================================================
// create with keepParentValues: false tests
// =============================================================================

Deno.test("create - keepParentValues false outputs only partial values", () => {
  const colors = theme({ primary: "blue", secondary: "green" });
  const dark = colors.create({ primary: "white" }, { keepParentValues: false });

  const css = render(style(dark));
  assertEquals(css.includes("white"), true);
  // secondary should NOT be in output when keepParentValues is false
  assertEquals(css.includes("green"), false);
});

Deno.test("create - keepParentValues false with nested values", () => {
  const t = theme({
    colors: { primary: "blue", secondary: "green" },
    spacing: "8px",
  });

  const partial = t.create(
    { colors: { primary: "white" } },
    { keepParentValues: false },
  );

  const css = render(style(partial));
  assertEquals(css.includes("white"), true);
  // Only the partial values should be in output
  assertEquals(css.includes("blue"), false);
  assertEquals(css.includes("green"), false);
  assertEquals(css.includes("8px"), false);
});

// =============================================================================
// fallback tests
// =============================================================================

import { fallback } from "../themes.ts";

Deno.test("fallback - adds single fallback value", () => {
  const colors = theme({ primary: "blue" });
  const result = fallback(colors.primary, "red");
  assertEquals(result.includes("var(--"), true);
  assertEquals(result.includes(", red)"), true);
});

Deno.test("fallback - adds multiple fallback values", () => {
  const colors = theme({ primary: "blue" });
  const result = fallback(colors.primary, "red", "green");
  assertEquals(result.includes(", red, green)"), true);
});

Deno.test("fallback - works with custom hash", () => {
  const colors = theme({ primary: "blue" }, "custom");
  const result = fallback(colors.primary, "fallback");
  assertEquals(result, "var(--custom-primary, fallback)");
});

Deno.test("fallback - works with number fallback", () => {
  const spacing = theme({ unit: 8 });
  const result = fallback(spacing.unit, 16);
  assertEquals(result.includes(", 16)"), true);
});
