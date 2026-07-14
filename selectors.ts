/**
 * CSS selector type definitions.
 *
 * This module provides comprehensive TypeScript types for CSS selectors,
 * including HTML elements, pseudo-classes, pseudo-elements, and various
 * selector combinators.
 *
 * @module
 * @since 0.0.4
 */

import type { NestableRules } from "./atrules.ts";

/**
 * Standard HTML element tag names.
 *
 * A union type of all valid HTML, SVG, and MathML element names that can
 * be used as CSS type selectors. Organized by category for readability.
 *
 * @example
 * ```ts
 * import type { HtmlElement } from "./selectors.ts";
 *
 * const element: HtmlElement = "div";
 * const svg: HtmlElement = "svg";
 * const math: HtmlElement = "math";
 * ```
 *
 * @since 0.0.4
 */
// deno-fmt-ignore
export type HtmlElement =
  // Sectioning
  | "html" | "body" | "article" | "section" | "nav" | "aside"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "hgroup" | "header" | "footer" | "address" | "main"
  // Grouping
  | "p" | "hr" | "pre" | "blockquote" | "ol" | "ul" | "menu" | "li"
  | "dl" | "dt" | "dd" | "figure" | "figcaption" | "div"
  // Text-level
  | "a" | "em" | "strong" | "small" | "s" | "cite" | "q" | "dfn" | "abbr"
  | "ruby" | "rt" | "rp" | "data" | "time" | "code" | "var" | "samp" | "kbd"
  | "sub" | "sup" | "i" | "b" | "u" | "mark" | "bdi" | "bdo" | "span"
  | "br" | "wbr"
  // Edits
  | "ins" | "del"
  // Embedded
  | "picture" | "img" | "iframe" | "embed" | "object"
  | "video" | "audio" | "map" | "canvas"
  // Tabular
  | "table" | "caption" | "colgroup" | "col" | "tbody" | "thead" | "tfoot"
  | "tr" | "td" | "th"
  // Forms
  | "form" | "label" | "input" | "button" | "select" | "datalist"
  | "optgroup" | "option" | "textarea" | "output" | "progress" | "meter"
  | "fieldset" | "legend"
  // Interactive
  | "details" | "summary" | "dialog"
  // Scripting
  | "noscript" | "slot"
  // SVG (rendered elements only)
  | "svg" | "g" | "path" | "circle" | "ellipse" | "line" | "polyline"
  | "polygon" | "rect" | "text" | "tspan" | "textPath" | "image" | "use"
  | "foreignObject"
  // MathML
  | "math" | "mi" | "mn" | "mo" | "ms" | "mtext" | "mrow" | "mfrac"
  | "msqrt" | "mroot" | "msub" | "msup" | "msubsup" | "munder" | "mover"
  | "munderover" | "mtable" | "mtr" | "mtd";

/**
 * The universal selector that matches any element.
 *
 * @example
 * ```ts
 * import type { UniversalSelector } from "./selectors.ts";
 *
 * const selector: UniversalSelector = "*";
 * ```
 *
 * @since 0.0.4
 */
export type UniversalSelector = "*";

/**
 * The parent/nesting selector used in CSS nesting.
 *
 * Represents the parent selector context in nested rules, always starting
 * with `&`. Can be combined with other selectors.
 *
 * @example
 * ```ts
 * import type { ParentSelector } from "./selectors.ts";
 *
 * const hover: ParentSelector = "&:hover";
 * const child: ParentSelector = "& > div";
 * const modifier: ParentSelector = "&.active";
 * ```
 *
 * @since 0.0.4
 */
export type ParentSelector = `&${string}`;

/**
 * A class selector starting with a dot.
 *
 * @example
 * ```ts
 * import type { ClassSelector } from "./selectors.ts";
 *
 * const button: ClassSelector = ".button";
 * const primary: ClassSelector = ".btn-primary";
 * ```
 *
 * @since 0.0.4
 */
export type ClassSelector = `.${string}`;

/**
 * An ID selector starting with a hash.
 *
 * @example
 * ```ts
 * import type { IDSelector } from "./selectors.ts";
 *
 * const header: IDSelector = "#header";
 * const main: IDSelector = "#main-content";
 * ```
 *
 * @since 0.0.4
 */
export type IDSelector = `#${string}`;

/**
 * An attribute selector enclosed in square brackets.
 *
 * @example
 * ```ts
 * import type { AttributeSelector } from "./selectors.ts";
 *
 * const dataAttr: AttributeSelector = "[data-active]";
 * const typeInput: AttributeSelector = '[type="text"]';
 * const contains: AttributeSelector = '[class*="btn"]';
 * ```
 *
 * @since 0.0.4
 */
export type AttributeSelector = `[${string}]`;

/**
 * Simple selectors that can be used standalone or combined.
 *
 * Includes HTML elements, universal selector, parent selector, class
 * selectors, ID selectors, and attribute selectors.
 *
 * @example
 * ```ts
 * import type { SimpleSelectors } from "./selectors.ts";
 *
 * const element: SimpleSelectors = "div";
 * const universal: SimpleSelectors = "*";
 * const className: SimpleSelectors = ".card";
 * const id: SimpleSelectors = "#header";
 * const attr: SimpleSelectors = "[data-active]";
 * ```
 *
 * @since 0.0.4
 */
export type SimpleSelectors =
  | HtmlElement
  | UniversalSelector
  | ParentSelector
  | ClassSelector
  | IDSelector
  | AttributeSelector;

/**
 * Simple pseudo-classes that take no arguments.
 *
 * Includes user action states (:hover, :focus), link states (:visited),
 * input states (:disabled, :checked), validation states (:valid, :invalid),
 * tree-structural selectors (:first-child, :empty), and more.
 *
 * @example
 * ```ts
 * import type { PseudoClassSimple } from "./selectors.ts";
 *
 * const hover: PseudoClassSimple = ":hover";
 * const disabled: PseudoClassSimple = ":disabled";
 * const firstChild: PseudoClassSimple = ":first-child";
 * ```
 *
 * @since 0.0.4
 */
// deno-fmt-ignore
export type PseudoClassSimple =
  // User action
  | ":active" | ":hover" | ":focus" | ":focus-visible" | ":focus-within"
  // Link
  | ":link" | ":visited" | ":any-link" | ":local-link" | ":target"
  | ":target-within"
  // Input state
  | ":enabled" | ":disabled" | ":read-only" | ":read-write"
  | ":placeholder-shown" | ":autofill" | ":default" | ":checked"
  | ":indeterminate"
  // Validation
  | ":valid" | ":invalid" | ":in-range" | ":out-of-range" | ":required"
  | ":optional" | ":user-valid" | ":user-invalid"
  // Tree-structural
  | ":root" | ":empty" | ":first-child" | ":last-child" | ":only-child"
  | ":first-of-type" | ":last-of-type" | ":only-of-type"
  // Resource state
  | ":playing" | ":paused" | ":seeking" | ":buffering" | ":stalled"
  | ":muted" | ":volume-locked"
  // Time-dimensional
  | ":current" | ":past" | ":future"
  // Display state
  | ":fullscreen" | ":modal" | ":picture-in-picture" | ":open"
  | ":closed" | ":popover-open"
  // Printing
  | ":first" | ":left" | ":right" | ":blank"
  // Misc
  | ":defined" | ":scope";

/**
 * Functional pseudo-classes that require arguments.
 *
 * These pseudo-classes take parameters in parentheses, such as
 * `:nth-child(2n+1)` or `:not(.hidden)`.
 *
 * @example
 * ```ts
 * import type { PseudoClassFunctional } from "./selectors.ts";
 *
 * const nthChild: PseudoClassFunctional = ":nth-child(2n+1)";
 * const hasChild: PseudoClassFunctional = ":has(.active)";
 * const notHidden: PseudoClassFunctional = ":not(.hidden)";
 * ```
 *
 * @since 0.0.4
 */
// deno-fmt-ignore
export type PseudoClassFunctional =
  | `:dir(${"ltr" | "rtl"})`
  | `:has(${string})`
  | `:is(${string})`
  | `:lang(${string})`
  | `:not(${string})`
  | `:nth-child(${string})`
  | `:nth-col(${string})`
  | `:nth-last-child(${string})`
  | `:nth-last-col(${string})`
  | `:nth-last-of-type(${string})`
  | `:nth-of-type(${string})`
  | `:where(${string})`;

/**
 * All pseudo-classes, both simple and functional.
 *
 * A union of {@link PseudoClassSimple} (no arguments) and
 * {@link PseudoClassFunctional} (require arguments).
 *
 * @example
 * ```ts
 * import type { PseudoClass } from "./selectors.ts";
 *
 * const simple: PseudoClass = ":hover";
 * const functional: PseudoClass = ":nth-child(2n+1)";
 * const negation: PseudoClass = ":not(.hidden)";
 * ```
 *
 * @since 0.0.4
 */
export type PseudoClass = PseudoClassSimple | PseudoClassFunctional;

/**
 * CSS pseudo-elements for targeting specific parts of elements.
 *
 * Uses the double-colon (::) canonical syntax. These pseudo-elements
 * target generated content or specific portions of an element.
 *
 * @example
 * ```ts
 * import type { PseudoElement } from "./selectors.ts";
 *
 * const before: PseudoElement = "::before";
 * const after: PseudoElement = "::after";
 * const firstLetter: PseudoElement = "::first-letter";
 * ```
 *
 * @since 0.0.4
 */
export type PseudoElement =
  | "::after"
  | "::before"
  | "::first-letter"
  | "::first-line";

/**
 * Raw selector types without arbitrary string fallback.
 *
 * A union of all typed selector categories: simple selectors, class/ID/attribute
 * selectors, pseudo-classes, pseudo-elements, and nestable at-rules.
 *
 * @example
 * ```ts
 * import type { RawSelector } from "./selectors.ts";
 *
 * const element: RawSelector = "button";
 * const className: RawSelector = ".active";
 * const pseudo: RawSelector = ":hover";
 * const media: RawSelector = "@media (min-width: 768px)";
 * ```
 *
 * @since 0.0.4
 */
export type RawSelector =
  | SimpleSelectors
  | ClassSelector
  | IDSelector
  | AttributeSelector
  | PseudoClass
  | PseudoElement
  | NestableRules;

/**
 * Any valid CSS selector.
 *
 * Includes all {@link RawSelector} types plus an escape hatch for arbitrary
 * selector strings. The `string & {}` pattern allows any string while still
 * providing autocomplete for known selector types.
 *
 * @example
 * ```ts
 * import type { Selector } from "./selectors.ts";
 *
 * const typed: Selector = ".button:hover";
 * const complex: Selector = "nav > ul li:first-child";
 * const custom: Selector = "[data-theme='dark'] .card";
 * ```
 *
 * @since 0.0.4
 */
// deno-lint-ignore ban-types
export type Selector = RawSelector | (string & {});
