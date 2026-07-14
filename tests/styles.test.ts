import { assertEquals, assertNotEquals } from "@std/assert";
import {
  group,
  hasStyles,
  join,
  MINIMAL_RENDER_OPTIONS,
  properties,
  render,
  type RenderOptions,
  STANDARD_RENDER_OPTIONS,
  type Style,
  style,
  type StyleInput,
  use,
} from "../styles.ts";

// =============================================================================
// style tests
// =============================================================================

Deno.test("style - creates Style with auto-generated class name", () => {
  const btn = style({ color: "red" });
  // toString returns the classname without the leading dot
  assertEquals(btn.toString().length > 0, true);
  assertEquals(btn.toString().startsWith("."), false);
});

Deno.test("style - returns consistent class name for same input", () => {
  const btn1 = style({ color: "red" });
  const btn2 = style({ color: "red" });
  assertEquals(btn1.toString(), btn2.toString());
});

Deno.test("style - returns different class names for different inputs", () => {
  const btn1 = style({ color: "red" });
  const btn2 = style({ color: "blue" });
  assertNotEquals(btn1.toString(), btn2.toString());
});

Deno.test("style - accepts custom selector", () => {
  const heading = style("h1", { fontSize: "2rem" });
  // Element selectors return empty string from toString
  assertEquals(heading.toString(), "");
});

Deno.test("style - accepts class selector", () => {
  const btn = style(".button", { padding: "8px" });
  // toString returns the classname without the leading dot
  assertEquals(btn.toString(), "button");
});

Deno.test("style - accepts ID selector", () => {
  const main = style("#main", { width: "100%" });
  // ID selectors return empty string from toString
  assertEquals(main.toString(), "");
});

Deno.test("style - accepts pseudo-class selectors", () => {
  const link = style("a:hover", { color: "blue" });
  // Pseudo-class selectors return empty string from toString
  assertEquals(link.toString(), "");
});

Deno.test("style - accepts nested selectors", () => {
  const btn = style({
    color: "white",
    "&:hover": { color: "blue" },
  });
  assertEquals(typeof btn.toString(), "string");
});

// =============================================================================
// hasStyles tests
// =============================================================================

Deno.test("hasStyles - returns true for Style objects", () => {
  const btn = style({ color: "red" });
  assertEquals(hasStyles(btn), true);
});

Deno.test("hasStyles - returns true for StyleGroup objects", () => {
  const g = group({
    primary: style({ color: "blue" }),
  });
  assertEquals(hasStyles(g), true);
});

Deno.test("hasStyles - returns true for joined styles", () => {
  const a = style({ color: "red" });
  const b = style({ color: "blue" });
  const joined = join(a, b);
  assertEquals(hasStyles(joined), true);
});

Deno.test("hasStyles - returns false for plain objects", () => {
  assertEquals(hasStyles({ color: "red" }), false);
});

Deno.test("hasStyles - returns false for null", () => {
  assertEquals(hasStyles(null), false);
});

Deno.test("hasStyles - returns false for undefined", () => {
  assertEquals(hasStyles(undefined), false);
});

Deno.test("hasStyles - returns false for strings", () => {
  assertEquals(hasStyles(".button"), false);
});

Deno.test("hasStyles - returns false for arrays", () => {
  assertEquals(hasStyles([]), false);
});

Deno.test("hasStyles - returns false for numbers", () => {
  assertEquals(hasStyles(42), false);
});

// =============================================================================
// properties tests
// =============================================================================

Deno.test("properties - returns input unchanged", () => {
  const input: StyleInput = { color: "red", padding: "8px" };
  const result = properties(input);
  assertEquals(result, input);
});

Deno.test("properties - preserves nested selectors", () => {
  const input: StyleInput = {
    color: "white",
    "&:hover": { color: "blue" },
  };
  const result = properties(input);
  assertEquals(result, input);
});

Deno.test("properties - preserves custom properties", () => {
  const input = { "--primary": "blue" };
  const result = properties(input);
  assertEquals(result["--primary"], "blue");
});

// =============================================================================
// use tests
// =============================================================================

Deno.test("use - joins single style", () => {
  const btn = style({ color: "red" });
  const result = use(btn);
  assertEquals(result, btn.toString());
});

Deno.test("use - joins multiple styles with space", () => {
  const base = style({ padding: "8px" });
  const active = style({ color: "blue" });
  const result = use(base, active);
  assertEquals(result, `${base.toString()} ${active.toString()}`);
});

Deno.test("use - handles three styles", () => {
  const a = style({ padding: "8px" });
  const b = style({ color: "blue" });
  const c = style({ margin: "4px" });
  const result = use(a, b, c);
  assertEquals(result, `${a.toString()} ${b.toString()} ${c.toString()}`);
});

// =============================================================================
// render tests
// =============================================================================

Deno.test("render - renders single style with standard options", () => {
  const btn = style(".btn", { color: "red" });
  const css = render(btn);
  assertEquals(css.includes(".btn"), true);
  assertEquals(css.includes("color"), true);
  assertEquals(css.includes("red"), true);
});

Deno.test("render - converts camelCase to kebab-case", () => {
  const btn = style(".btn", { backgroundColor: "blue" });
  const css = render(btn);
  assertEquals(css.includes("background-color"), true);
});

Deno.test("render - preserves custom properties (--*)", () => {
  const vars = style(":root", { "--primary": "blue" } as StyleInput);
  const css = render(vars);
  assertEquals(css.includes("--primary"), true);
});

Deno.test("render - renders multiple styles with join", () => {
  const btn = style(".btn", { color: "white" });
  const heading = style("h1", { fontSize: "2rem" });
  const css = render(join(btn, heading));
  assertEquals(css.includes(".btn"), true);
  assertEquals(css.includes("h1"), true);
});

Deno.test("render - accepts explicit standard options", () => {
  const btn = style(".btn", { color: "red" });
  const css = render(btn, STANDARD_RENDER_OPTIONS);
  assertEquals(css.includes("\n"), true);
  assertEquals(css.includes("  "), true);
});

Deno.test("render - accepts minimal options", () => {
  const btn = style(".btn", { color: "red" });
  const css = render(btn, MINIMAL_RENDER_OPTIONS);
  assertEquals(css.includes("\n"), false);
  assertEquals(css.includes("  "), false);
});

Deno.test("render - renders nested selectors", () => {
  const btn = style(".btn", {
    color: "white",
    "&:hover": { color: "blue" },
  });
  const css = render(btn);
  assertEquals(css.includes("&:hover"), true);
  assertEquals(css.includes("blue"), true);
});

Deno.test("render - handles deeply nested selectors", () => {
  const btn = style(".btn", {
    color: "white",
    "&:hover": {
      color: "blue",
      "& span": { fontWeight: "bold" },
    },
  });
  const css = render(btn);
  assertEquals(css.includes("& span"), true);
  assertEquals(css.includes("font-weight"), true);
});

Deno.test("render - handles number values", () => {
  const box = style(".box", { zIndex: 10, opacity: 0.5 });
  const css = render(box);
  assertEquals(css.includes("z-index"), true);
  assertEquals(css.includes("10"), true);
  assertEquals(css.includes("0.5"), true);
});

Deno.test("render - handles no nested selectors", () => {
  const btn = style(".btn", {
    color: "white",
  });
  const css = render(btn);
  assertEquals(css.includes(".btn"), true);
});

Deno.test("render - handles undefined nested selector values", () => {
  const btn = style(".btn", {
    color: "white",
    "&:hover": undefined,
  } as StyleInput);
  const css = render(btn);
  assertEquals(css.includes(".btn"), true);
});

Deno.test("render - renders same style twice correctly", () => {
  const btn = style(".btn", { color: "red" });
  const css1 = render(btn);
  const css2 = render(btn);
  assertEquals(css1, css2);
});

// =============================================================================
// RenderOptions tests
// =============================================================================

Deno.test("STANDARD_RENDER_OPTIONS - has expected values", () => {
  assertEquals(STANDARD_RENDER_OPTIONS.newline, "\n");
  assertEquals(STANDARD_RENDER_OPTIONS.indent, "  ");
  assertEquals(STANDARD_RENDER_OPTIONS.space, " ");
});

Deno.test("MINIMAL_RENDER_OPTIONS - has expected values", () => {
  assertEquals(MINIMAL_RENDER_OPTIONS.newline, "");
  assertEquals(MINIMAL_RENDER_OPTIONS.indent, "");
  assertEquals(MINIMAL_RENDER_OPTIONS.space, "");
});

Deno.test("render - custom options work correctly", () => {
  const customOptions: RenderOptions = {
    newline: "\r\n",
    indent: "\t",
    space: " ",
  };
  const btn = style(".btn", { color: "red" });
  const css = render(btn, customOptions);
  assertEquals(css.includes("\r\n"), true);
  assertEquals(css.includes("\t"), true);
});

// =============================================================================
// Type verification tests
// =============================================================================

Deno.test("StyleInput - accepts CSS properties", () => {
  const input: StyleInput = {
    color: "red",
    backgroundColor: "blue",
    padding: "8px",
    margin: 0,
  };
  assertEquals(input.color, "red");
});

Deno.test("StyleInput - accepts custom properties", () => {
  const input: StyleInput = {
    "--primary": "blue",
    "--spacing": 8,
  };
  assertEquals(input["--primary"], "blue");
});

Deno.test("StyleInput - accepts nested selectors as keys", () => {
  const input: StyleInput = {
    color: "white",
    "&:hover": { color: "blue" },
    "& > span": { fontWeight: "bold" },
  };
  assertEquals("&:hover" in input, true);
});

Deno.test("Style - has toString method", () => {
  const btn: Style = style({ color: "red" });
  assertEquals(typeof btn.toString, "function");
  assertEquals(typeof btn.toString(), "string");
});

// =============================================================================
// join tests
// =============================================================================

Deno.test("join - combines two styles", () => {
  const a = style(".a", { color: "red" });
  const b = style(".b", { color: "blue" });
  const combined = join(a, b);
  const css = render(combined);
  assertEquals(css.includes(".a"), true);
  assertEquals(css.includes(".b"), true);
  assertEquals(css.includes("red"), true);
  assertEquals(css.includes("blue"), true);
});

Deno.test("join - supports nested joins", () => {
  const a = style(".a", { color: "red" });
  const b = style(".b", { color: "blue" });
  const c = style(".c", { color: "green" });
  const combined = join(a, join(b, c));
  const css = render(combined);
  assertEquals(css.includes(".a"), true);
  assertEquals(css.includes(".b"), true);
  assertEquals(css.includes(".c"), true);
});

Deno.test("join - preserves order of blocks", () => {
  const a = style(".first", { color: "red" });
  const b = style(".second", { color: "blue" });
  const c = style(".third", { color: "green" });
  const combined = join(a, b, c);
  const css = render(combined);
  const firstIndex = css.indexOf(".first");
  const secondIndex = css.indexOf(".second");
  const thirdIndex = css.indexOf(".third");
  assertEquals(firstIndex < secondIndex, true);
  assertEquals(secondIndex < thirdIndex, true);
});

Deno.test("join - can be rendered multiple times", () => {
  const a = style(".a", { color: "red" });
  const b = style(".b", { color: "blue" });
  const combined = join(a, b);
  const css1 = render(combined);
  const css2 = render(combined);
  assertEquals(css1, css2);
});

// =============================================================================
// group tests
// =============================================================================

Deno.test("group - creates group from shape", () => {
  const g = group({
    primary: style(".primary", { color: "blue" }),
    secondary: style(".secondary", { color: "gray" }),
  });
  assertEquals(g.primary.toString(), "primary");
  assertEquals(g.secondary.toString(), "secondary");
});

Deno.test("group - renders all leaf styles", () => {
  const g = group({
    primary: style(".primary", { color: "blue" }),
    secondary: style(".secondary", { color: "gray" }),
  });
  const css = render(g);
  assertEquals(css.includes(".primary"), true);
  assertEquals(css.includes(".secondary"), true);
  assertEquals(css.includes("blue"), true);
  assertEquals(css.includes("gray"), true);
});

Deno.test("group - handles nested shapes", () => {
  const g = group({
    button: {
      primary: style(".btn-primary", { color: "white" }),
      secondary: style(".btn-secondary", { color: "black" }),
    },
    text: style(".text", { fontSize: "1rem" }),
  });
  assertEquals(g.button.primary.toString(), "btn-primary");
  assertEquals(g.button.secondary.toString(), "btn-secondary");
  assertEquals(g.text.toString(), "text");
  const css = render(g);
  assertEquals(css.includes(".btn-primary"), true);
  assertEquals(css.includes(".btn-secondary"), true);
  assertEquals(css.includes(".text"), true);
});

Deno.test("group - can be passed to join", () => {
  const g = group({
    primary: style(".primary", { color: "blue" }),
  });
  const extra = style(".extra", { padding: "8px" });
  const combined = join(g, extra);
  const css = render(combined);
  assertEquals(css.includes(".primary"), true);
  assertEquals(css.includes(".extra"), true);
});

Deno.test("group - StyleBlockSymbol is not enumerable", () => {
  const g = group({
    primary: style(".primary", { color: "blue" }),
  });
  const keys = Object.keys(g);
  assertEquals(keys, ["primary"]);
});
