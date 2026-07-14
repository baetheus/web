import type {
  AttributeSelector,
  ClassSelector,
  HtmlElement,
  IDSelector,
  ParentSelector,
  PseudoClass,
  PseudoClassFunctional,
  PseudoClassSimple,
  PseudoElement,
  RawSelector,
  Selector,
  SimpleSelectors,
  UniversalSelector,
} from "../selectors.ts";

// =============================================================================
// Type test stubs
// =============================================================================

/** Stub function to exercise valid RawSelector types at compile time */
function rawselect(_s: RawSelector): void {}

/** Stub function to exercise valid RawSelector types at compile time */
function select(_s: Selector): void {}

// =============================================================================
// Positive type tests - valid selectors
// =============================================================================

// HtmlElement selectors
Deno.test("select - accepts sectioning elements", () => {
  rawselect("html");
  rawselect("body");
  rawselect("article");
  rawselect("section");
  rawselect("nav");
  rawselect("aside");
  rawselect("h1");
  rawselect("h2");
  rawselect("h3");
  rawselect("h4");
  rawselect("h5");
  rawselect("h6");
  rawselect("hgroup");
  rawselect("header");
  rawselect("footer");
  rawselect("address");
  rawselect("main");
});

Deno.test("select - accepts grouping elements", () => {
  rawselect("p");
  rawselect("hr");
  rawselect("pre");
  rawselect("blockquote");
  rawselect("ol");
  rawselect("ul");
  rawselect("menu");
  rawselect("li");
  rawselect("dl");
  rawselect("dt");
  rawselect("dd");
  rawselect("figure");
  rawselect("figcaption");
  rawselect("div");
});

Deno.test("select - accepts text-level elements", () => {
  rawselect("a");
  rawselect("em");
  rawselect("strong");
  rawselect("small");
  rawselect("s");
  rawselect("cite");
  rawselect("q");
  rawselect("dfn");
  rawselect("abbr");
  rawselect("ruby");
  rawselect("rt");
  rawselect("rp");
  rawselect("data");
  rawselect("time");
  rawselect("code");
  rawselect("var");
  rawselect("samp");
  rawselect("kbd");
  rawselect("sub");
  rawselect("sup");
  rawselect("i");
  rawselect("b");
  rawselect("u");
  rawselect("mark");
  rawselect("bdi");
  rawselect("bdo");
  rawselect("span");
  rawselect("br");
  rawselect("wbr");
});

Deno.test("select - accepts edit elements", () => {
  rawselect("ins");
  rawselect("del");
});

Deno.test("select - accepts embedded elements", () => {
  rawselect("picture");
  rawselect("img");
  rawselect("iframe");
  rawselect("embed");
  rawselect("object");
  rawselect("video");
  rawselect("audio");
  rawselect("map");
  rawselect("canvas");
});

Deno.test("select - accepts tabular elements", () => {
  rawselect("table");
  rawselect("caption");
  rawselect("colgroup");
  rawselect("col");
  rawselect("tbody");
  rawselect("thead");
  rawselect("tfoot");
  rawselect("tr");
  rawselect("td");
  rawselect("th");
});

Deno.test("select - accepts form elements", () => {
  rawselect("form");
  rawselect("label");
  rawselect("input");
  rawselect("button");
  rawselect("select");
  rawselect("datalist");
  rawselect("optgroup");
  rawselect("option");
  rawselect("textarea");
  rawselect("output");
  rawselect("progress");
  rawselect("meter");
  rawselect("fieldset");
  rawselect("legend");
});

Deno.test("select - accepts interactive elements", () => {
  rawselect("details");
  rawselect("summary");
  rawselect("dialog");
});

Deno.test("select - accepts scripting elements", () => {
  rawselect("noscript");
  rawselect("slot");
});

Deno.test("select - accepts SVG elements", () => {
  rawselect("svg");
  rawselect("g");
  rawselect("path");
  rawselect("circle");
  rawselect("ellipse");
  rawselect("line");
  rawselect("polyline");
  rawselect("polygon");
  rawselect("rect");
  rawselect("text");
  rawselect("tspan");
  rawselect("textPath");
  rawselect("image");
  rawselect("use");
  rawselect("foreignObject");
});

Deno.test("select - accepts MathML elements", () => {
  rawselect("math");
  rawselect("mi");
  rawselect("mn");
  rawselect("mo");
  rawselect("ms");
  rawselect("mtext");
  rawselect("mrow");
  rawselect("mfrac");
  rawselect("msqrt");
  rawselect("mroot");
  rawselect("msub");
  rawselect("msup");
  rawselect("msubsup");
  rawselect("munder");
  rawselect("mover");
  rawselect("munderover");
  rawselect("mtable");
  rawselect("mtr");
  rawselect("mtd");
});

Deno.test("select - accepts universal selector", () => {
  rawselect("*");
});

Deno.test("select - accepts parent selectors", () => {
  rawselect("&");
  rawselect("&:hover");
  rawselect("&:focus");
  rawselect("& > span");
  rawselect("&.active");
  rawselect("&#id");
  rawselect("&[disabled]");
  rawselect("& + p");
  rawselect("& ~ div");
});

Deno.test("select - accepts class selectors", () => {
  rawselect(".button");
  rawselect(".my-class");
  rawselect(".BEM__block--modifier");
  rawselect(".camelCase");
  rawselect(".-leading-dash");
  rawselect("._underscore");
});

Deno.test("select - accepts ID selectors", () => {
  rawselect("#main");
  rawselect("#my-id");
  rawselect("#camelCaseId");
  rawselect("#id123");
});

Deno.test("select - accepts attribute selectors", () => {
  rawselect("[disabled]");
  rawselect('[type="text"]');
  rawselect("[data-value]");
  rawselect('[href^="https"]');
  rawselect('[class*="btn"]');
  rawselect('[lang|="en"]');
  rawselect("[title~='word']");
  rawselect('[href$=".pdf"]');
});

Deno.test("select - accepts simple pseudo-classes (user action)", () => {
  rawselect(":active");
  rawselect(":hover");
  rawselect(":focus");
  rawselect(":focus-visible");
  rawselect(":focus-within");
});

Deno.test("select - accepts simple pseudo-classes (link)", () => {
  rawselect(":link");
  rawselect(":visited");
  rawselect(":any-link");
  rawselect(":local-link");
  rawselect(":target");
  rawselect(":target-within");
});

Deno.test("select - accepts simple pseudo-classes (input state)", () => {
  rawselect(":enabled");
  rawselect(":disabled");
  rawselect(":read-only");
  rawselect(":read-write");
  rawselect(":placeholder-shown");
  rawselect(":autofill");
  rawselect(":default");
  rawselect(":checked");
  rawselect(":indeterminate");
});

Deno.test("select - accepts simple pseudo-classes (validation)", () => {
  rawselect(":valid");
  rawselect(":invalid");
  rawselect(":in-range");
  rawselect(":out-of-range");
  rawselect(":required");
  rawselect(":optional");
  rawselect(":user-valid");
  rawselect(":user-invalid");
});

Deno.test("select - accepts simple pseudo-classes (tree-structural)", () => {
  rawselect(":root");
  rawselect(":empty");
  rawselect(":first-child");
  rawselect(":last-child");
  rawselect(":only-child");
  rawselect(":first-of-type");
  rawselect(":last-of-type");
  rawselect(":only-of-type");
});

Deno.test("select - accepts simple pseudo-classes (resource state)", () => {
  rawselect(":playing");
  rawselect(":paused");
  rawselect(":seeking");
  rawselect(":buffering");
  rawselect(":stalled");
  rawselect(":muted");
  rawselect(":volume-locked");
});

Deno.test("select - accepts simple pseudo-classes (time-dimensional)", () => {
  rawselect(":current");
  rawselect(":past");
  rawselect(":future");
});

Deno.test("select - accepts simple pseudo-classes (display state)", () => {
  rawselect(":fullscreen");
  rawselect(":modal");
  rawselect(":picture-in-picture");
  rawselect(":open");
  rawselect(":closed");
  rawselect(":popover-open");
});

Deno.test("select - accepts simple pseudo-classes (printing)", () => {
  rawselect(":first");
  rawselect(":left");
  rawselect(":right");
  rawselect(":blank");
});

Deno.test("select - accepts simple pseudo-classes (misc)", () => {
  rawselect(":defined");
  rawselect(":scope");
});

Deno.test("select - accepts functional pseudo-classes", () => {
  rawselect(":dir(ltr)");
  rawselect(":dir(rtl)");
  rawselect(":has(.child)");
  rawselect(":has(> img)");
  rawselect(":is(button, a)");
  rawselect(":is(h1, h2, h3)");
  rawselect(":lang(en)");
  rawselect(":lang(zh-Hans)");
  rawselect(":not(.disabled)");
  rawselect(":not(:first-child)");
  rawselect(":nth-child(2n+1)");
  rawselect(":nth-child(odd)");
  rawselect(":nth-col(2)");
  rawselect(":nth-last-child(3)");
  rawselect(":nth-last-col(1)");
  rawselect(":nth-last-of-type(2)");
  rawselect(":nth-of-type(even)");
  rawselect(":where(section, article)");
});

Deno.test("select - accepts pseudo-elements", () => {
  rawselect("::after");
  rawselect("::before");
  rawselect("::first-letter");
  rawselect("::first-line");
});

Deno.test("select - accepts nestable at-rules", () => {
  rawselect("@media");
  rawselect("@media screen");
  rawselect("@media (min-width: 768px)");
  rawselect("@supports (display: grid)");
  rawselect("@container");
  rawselect("@container (min-width: 300px)");
  rawselect("@layer");
  rawselect("@layer utilities");
  rawselect("@scope");
  rawselect("@scope (.card)");
  rawselect("@scope (.card) to (.footer)");
  rawselect("@starting-style");
});

Deno.test("select - accepts arbitrary strings (escape hatch)", () => {
  select("div > p");
  select("ul li");
  select("input[type='checkbox']:checked + label");
  select(".parent .child");
  select("custom-element");
  select("my-web-component");
});

// =============================================================================
// Type narrowing tests
// =============================================================================

Deno.test("type narrowing - HtmlElement is subset of Selector", () => {
  const el: HtmlElement = "div";
  rawselect(el);
});

Deno.test("type narrowing - UniversalSelector is subset of Selector", () => {
  const universal: UniversalSelector = "*";
  rawselect(universal);
});

Deno.test("type narrowing - ParentSelector is subset of Selector", () => {
  const parent: ParentSelector = "&:hover";
  rawselect(parent);
});

Deno.test("type narrowing - ClassSelector is subset of Selector", () => {
  const cls: ClassSelector = ".button";
  rawselect(cls);
});

Deno.test("type narrowing - IDSelector is subset of Selector", () => {
  const id: IDSelector = "#main";
  rawselect(id);
});

Deno.test("type narrowing - AttributeSelector is subset of Selector", () => {
  const attr: AttributeSelector = "[disabled]";
  rawselect(attr);
});

Deno.test("type narrowing - SimpleSelectors is subset of Selector", () => {
  const simple: SimpleSelectors = "span";
  rawselect(simple);
});

Deno.test("type narrowing - PseudoClassSimple is subset of Selector", () => {
  const pseudo: PseudoClassSimple = ":hover";
  rawselect(pseudo);
});

Deno.test("type narrowing - PseudoClassFunctional is subset of Selector", () => {
  const pseudo: PseudoClassFunctional = ":nth-child(2n)";
  rawselect(pseudo);
});

Deno.test("type narrowing - PseudoClass is subset of Selector", () => {
  const pseudo: PseudoClass = ":focus";
  rawselect(pseudo);
});

Deno.test("type narrowing - PseudoElement is subset of Selector", () => {
  const pseudo: PseudoElement = "::before";
  rawselect(pseudo);
});
