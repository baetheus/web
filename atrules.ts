/**
 * CSS at-rule type definitions.
 *
 * This module provides comprehensive TypeScript types for all CSS at-rules,
 * enabling type-safe construction of at-rule preludes and their associated
 * property descriptors. Types are organized by context: top-level rules,
 * conditional group rules, and nested rules.
 *
 * @module
 * @since 0.0.4
 */

import type { Properties } from "csstype";
import { type Style, style, type StyleInput } from "./styles.ts";

/**
 * A quoted string value (single or double quotes).
 *
 * @example
 * ```ts
 * import type { Quoted } from "./atrules.ts";
 *
 * const double: Quoted = '"hello"';
 * const single: Quoted = "'world'";
 * ```
 *
 * @since 0.0.4
 */
export type Quoted = `"${string}"` | `'${string}'`;

/**
 * A CSS url() function value.
 *
 * @example
 * ```ts
 * import type { Url } from "./atrules.ts";
 *
 * const image: Url = "url(image.png)";
 * const font: Url = "url(https://fonts.example.com/font.woff2)";
 * ```
 *
 * @since 0.0.4
 */
export type Url = `url(${string})`;

/**
 * @charset — declares the character encoding of the stylesheet.
 *
 * Must be the very first statement when present.
 *
 * @example
 * ```ts
 * import type { CharsetRule } from "./atrules.ts";
 *
 * const utf8: CharsetRule = '@charset "UTF-8"';
 * const latin: CharsetRule = '@charset "ISO-8859-1"';
 * ```
 *
 * @since 0.0.4
 */
export type CharsetRule = `@charset ${Quoted}`;

/**
 * @import — imports an external stylesheet with optional layer / supports /
 * media conditions appended after the URL.
 *
 * @example
 * ```ts
 * import type { ImportRule } from "./atrules.ts";
 *
 * const basic: ImportRule = '@import "base.css"';
 * const withUrl: ImportRule = '@import url("print.css") print';
 * const withLayer: ImportRule = '@import "theme.css" layer(theme) supports(display: grid) screen';
 * ```
 *
 * @since 0.0.4
 */
// deno-fmt-ignore
export type ImportRule =
  | `@import ${Quoted | Url}`
  | `@import ${Quoted | Url} ${string}`

/**
 * @namespace — declares an XML namespace prefix for use in selectors.
 *
 * @example
 * ```ts
 * import type { NamespaceRule } from "./atrules.ts";
 *
 * const xhtml: NamespaceRule = "@namespace url(http://www.w3.org/1999/xhtml)";
 * const svg: NamespaceRule = "@namespace svg url(http://www.w3.org/2000/svg)";
 * ```
 *
 * @since 0.0.4
 */
// deno-fmt-ignore
export type NamespaceRule =
  | `@namespace ${Quoted | Url}`
  | `@namespace ${string} ${Quoted | Url}`

/**
 * @media — applies enclosed rules when one or more media conditions match.
 *
 * The bare `@media` form (no condition) is valid and matches all media.
 *
 * @example
 * ```ts
 * import type { MediaRule } from "./atrules.ts";
 *
 * const screen: MediaRule = "@media screen";
 * const responsive: MediaRule = "@media screen and (min-width: 768px)";
 * const dark: MediaRule = "@media (prefers-color-scheme: dark)";
 * ```
 *
 * @since 0.0.4
 */
export type MediaRule = `@media` | `@media ${string}`;

/**
 * @supports — applies enclosed rules when the browser supports the given
 * CSS feature, property, or selector.
 *
 * @example
 * ```ts
 * import type { SupportsRule } from "./atrules.ts";
 *
 * const grid: SupportsRule = "@supports (display: grid)";
 * const notGrid: SupportsRule = "@supports not (display: grid)";
 * const hasSelector: SupportsRule = "@supports selector(:has(+ *))";
 * ```
 *
 * @since 0.0.4
 */
export type SupportsRule = `@supports ${string}`;

/**
 * @container — applies enclosed rules when the nearest size or style
 * container matches the given query.
 *
 * The bare form targets any ancestor container.
 *
 * @example
 * ```ts
 * import type { ContainerRule } from "./atrules.ts";
 *
 * const anyContainer: ContainerRule = "@container (min-width: 300px)";
 * const named: ContainerRule = "@container sidebar (min-width: 300px)";
 * ```
 *
 * @since 0.0.4
 */
export type ContainerRule = `@container` | `@container ${string}`;

/**
 * @document — applies enclosed rules based on the document URL.
 *
 * Non-standard; supported only in Firefox with a -moz- prefix.
 *
 * @example
 * ```ts
 * import type { DocumentRule } from "./atrules.ts";
 *
 * const exact: DocumentRule = '@document url("https://example.com/")';
 * const prefix: DocumentRule = '@-moz-document url-prefix("https://")';
 * ```
 *
 * @since 0.0.4
 */
export type DocumentRule = `@document ${string}` | `@-moz-document ${string}`;

/**
 * @layer — defines or orders a cascade layer.
 *
 * Statement form declares layer order: `@layer base, components, utilities;`
 * Block form defines a layer's rules: `@layer utilities { … }`
 * Anonymous block form: `@layer { … }`
 *
 * @example
 * ```ts
 * import type { LayerRule } from "./atrules.ts";
 *
 * const anonymous: LayerRule = "@layer";
 * const named: LayerRule = "@layer utilities";
 * const order: LayerRule = "@layer base, components, utilities";
 * ```
 *
 * @since 0.0.4
 */
export type LayerRule = `@layer` | `@layer ${string}`;

/**
 * @starting-style — declares styles applied on the very first style
 * computation of an element (used to trigger CSS entry transitions).
 *
 * @example
 * ```ts
 * import type { StartingStyleRule } from "./atrules.ts";
 *
 * const rule: StartingStyleRule = "@starting-style";
 * ```
 *
 * @since 0.0.4
 */
export type StartingStyleRule = `@starting-style`;

/**
 * @scope — limits style rules to a scoping root and optionally excludes
 * a subtree via a scoping limit.
 *
 * The prelude defines the scope boundaries:
 * - `@scope` — implicit scope (styles apply to the element itself when nested)
 * - `@scope (selector)` — scopes to elements matching the selector
 * - `@scope (selector) to (selector)` — scopes from root to limit (exclusive)
 *
 * Inside the scope block, the `:scope` pseudo-class references the scoping root.
 *
 * @example
 * ```ts
 * import type { ScopeRule } from "./atrules.ts";
 *
 * const implicit: ScopeRule = "@scope";
 * const card: ScopeRule = "@scope (.card)";
 * const cardToSlot: ScopeRule = "@scope (.card) to (.slot)";
 * const nested: ScopeRule = "@scope (.light-theme) to (.dark-theme)";
 * ```
 *
 * @since 0.0.4
 */
export type ScopeRule = `@scope` | `@scope ${string}`;

/**
 * @font-face — describes a custom font and where to fetch it.
 *
 * Takes no prelude; all configuration lives in the block descriptors.
 *
 * @example
 * ```ts
 * import type { FontFaceRule } from "./atrules.ts";
 *
 * const rule: FontFaceRule = "@font-face";
 * ```
 *
 * @since 0.0.4
 */
export type FontFaceRule = `@font-face`;

/**
 * @font-feature-values — declares named aliases for OpenType feature indices,
 * so they can be referenced via font-variant-alternates.
 *
 * @example
 * ```ts
 * import type { FontFeatureValuesRule } from "./atrules.ts";
 *
 * const single: FontFeatureValuesRule = '@font-feature-values "Brill"';
 * const multiple: FontFeatureValuesRule = "@font-feature-values Brill, Skia";
 * ```
 *
 * @since 0.0.4
 */
export type FontFeatureValuesRule = `@font-feature-values ${string}`;

/**
 * @font-palette-values — overrides colours in a font's built-in palette or
 * creates a new palette entry.
 *
 * The name must be a custom-ident (-- prefixed).
 *
 * @example
 * ```ts
 * import type { FontPaletteValuesRule } from "./atrules.ts";
 *
 * const warm: FontPaletteValuesRule = "@font-palette-values --warm";
 * const brand: FontPaletteValuesRule = "@font-palette-values --brand-palette";
 * ```
 *
 * @since 0.0.4
 */
export type FontPaletteValuesRule = `@font-palette-values --${string}`;

/**
 * @keyframes — defines the keyframe steps for a named CSS animation.
 *
 * The -webkit- prefix form is still required for some older WebKit targets.
 *
 * @example
 * ```ts
 * import type { KeyframesRule } from "./atrules.ts";
 *
 * const slideIn: KeyframesRule = "@keyframes slide-in";
 * const custom: KeyframesRule = "@keyframes --my-animation";
 * const prefixed: KeyframesRule = "@-webkit-keyframes bounce";
 * ```
 *
 * @since 0.0.4
 */
export type KeyframesRule =
  | `@keyframes ${string}`
  | `@-webkit-keyframes ${string}`;

/**
 * @page — modifies the dimensions and margins of a printed page.
 *
 * The optional prelude is a page-selector: a named page or a pseudo-class.
 *
 * @example
 * ```ts
 * import type { PageRule } from "./atrules.ts";
 *
 * const all: PageRule = "@page";
 * const first: PageRule = "@page :first";
 * const named: PageRule = "@page LandscapeCover";
 * ```
 *
 * @since 0.0.4
 */
export type PageRule = `@page` | `@page ${string}`;

/**
 * @counter-style — defines a custom list/counter rendering style.
 *
 * @example
 * ```ts
 * import type { CounterStyleRule } from "./atrules.ts";
 *
 * const thumbs: CounterStyleRule = "@counter-style thumbs";
 * const alpha: CounterStyleRule = "@counter-style circled-alpha";
 * ```
 *
 * @since 0.0.4
 */
export type CounterStyleRule = "@counter-style" | `@counter-style ${string}`;

/**
 * @property — registers a custom CSS property with a type, initial value,
 * and inheritance flag (CSS Houdini / Properties & Values API Level 1).
 *
 * The name must be a custom-ident (-- prefixed).
 *
 * @example
 * ```ts
 * import type { PropertyRule } from "./atrules.ts";
 *
 * const color: PropertyRule = "@property --my-color";
 * const spacing: PropertyRule = "@property --spacing-unit";
 * ```
 *
 * @since 0.0.4
 */
export type PropertyRule = "@property" | `@property --${string}`;

/**
 * @color-profile — defines an ICC colour profile that can be referenced in
 * color() functions elsewhere in the stylesheet.
 *
 * @example
 * ```ts
 * import type { ColorProfileRule } from "./atrules.ts";
 *
 * const swop: ColorProfileRule = "@color-profile --swop5c";
 * const cmyk: ColorProfileRule = "@color-profile device-cmyk";
 * ```
 *
 * @since 0.0.4
 */
export type ColorProfileRule = "@color-profile" | `@color-profile ${string}`;

/**
 * Margin-box at-rules that target the 16 named margin areas of a printed page.
 *
 * These are only valid as direct children of an @page block; they are not
 * valid at the top level or inside any other rule.
 *
 * @example
 * ```ts
 * import type { PageMarginRule } from "./atrules.ts";
 *
 * const topLeft: PageMarginRule = "@top-left";
 * const bottomCenter: PageMarginRule = "@bottom-center";
 * const rightMiddle: PageMarginRule = "@right-middle";
 * ```
 *
 * @since 0.0.4
 */
// deno-fmt-ignore
export type PageMarginRule =
  | "@top-left-corner"    | "@top-left"    | "@top-center"    | "@top-right"    | "@top-right-corner"
  | "@bottom-left-corner" | "@bottom-left" | "@bottom-center" | "@bottom-right" | "@bottom-right-corner"
  | "@left-top"           | "@left-middle" | "@left-bottom"
  | "@right-top"          | "@right-middle" | "@right-bottom";

/**
 * Sub at-rules valid only inside a @font-feature-values block.
 *
 * Each one declares named aliases for a specific OpenType feature category.
 *
 * @example
 * ```ts
 * import type { FontFeatureSubRule } from "./atrules.ts";
 *
 * const swash: FontFeatureSubRule = "@swash";
 * const styleset: FontFeatureSubRule = "@styleset";
 * ```
 *
 * @since 0.0.4
 */
export type FontFeatureSubRule =
  | "@swash"
  | "@annotation"
  | "@ornaments"
  | "@stylistic"
  | "@styleset"
  | "@character-variant";

/**
 * At-rules that may appear directly inside a CSS selector (style) rule.
 *
 * Defined by CSS Nesting Level 1 and the Cascade 5 spec. These rules
 * inherit the enclosing selector's specificity context and can reference
 * the nesting selector (&) in their enclosed rules.
 *
 * - @media, @supports, @container — conditional group rules
 * - @layer — cascade layer scoped to the selector
 * - @scope — scopes styles to a root element and optional limit
 * - @starting-style — entry-transition initial values
 *
 * @example
 * ```ts
 * import type { SelectorNestedAtRule } from "./atrules.ts";
 *
 * const media: SelectorNestedAtRule = "@media (min-width: 768px)";
 * const supports: SelectorNestedAtRule = "@supports (display: grid)";
 * const layer: SelectorNestedAtRule = "@layer utilities";
 * const scope: SelectorNestedAtRule = "@scope (.card) to (.slot)";
 * ```
 *
 * @since 0.0.4
 */
export type SelectorNestedAtRule =
  | MediaRule
  | SupportsRule
  | ContainerRule
  | LayerRule
  | ScopeRule
  | StartingStyleRule;

/**
 * At-rules that may appear inside a conditional group rule
 * (@media, @supports, @container, @layer, @scope, @document).
 *
 * This is a strict superset of SelectorNestedAtRule. In addition to the
 * rules that nest under selectors, conditional groups can also host the
 * "resource" at-rules that declare fonts, animations, counters, and so on.
 *
 * Conditional group rules can also nest each other to arbitrary depth.
 *
 * @example
 * ```ts
 * import type { ConditionalGroupNestedAtRule } from "./atrules.ts";
 *
 * const media: ConditionalGroupNestedAtRule = "@media print";
 * const fontFace: ConditionalGroupNestedAtRule = "@font-face";
 * const keyframes: ConditionalGroupNestedAtRule = "@keyframes fade";
 * ```
 *
 * @since 0.0.4
 */
export type ConditionalGroupNestedAtRule =
  | MediaRule
  | SupportsRule
  | ContainerRule
  | LayerRule
  | ScopeRule
  | StartingStyleRule
  | FontFaceRule
  | FontFeatureValuesRule
  | FontPaletteValuesRule
  | KeyframesRule
  | CounterStyleRule
  | PropertyRule
  | ColorProfileRule
  | PageRule;

/**
 * Any valid CSS at-rule prelude string.
 *
 * Use the narrower exports for context-specific validation:
 * - `SelectorNestedAtRule` — valid inside a selector / style rule
 * - `ConditionalGroupNestedAtRule` — valid inside @media, @supports, etc.
 * - `PageMarginRule` — valid inside @page only
 * - `FontFeatureSubRule` — valid inside @font-feature-values only
 *
 * @example
 * ```ts
 * import type { CSSAtRule } from "./atrules.ts";
 *
 * const media: CSSAtRule = "@media screen";
 * const charset: CSSAtRule = '@charset "UTF-8"';
 * const keyframes: CSSAtRule = "@keyframes bounce";
 * ```
 *
 * @since 0.0.4
 */
export type CSSAtRule =
  | CharsetRule
  | ImportRule
  | NamespaceRule
  | MediaRule
  | SupportsRule
  | ContainerRule
  | DocumentRule
  | LayerRule
  | ScopeRule
  | StartingStyleRule
  | FontFaceRule
  | FontFeatureValuesRule
  | FontPaletteValuesRule
  | KeyframesRule
  | PageRule
  | CounterStyleRule
  | PropertyRule
  | ColorProfileRule
  | PageMarginRule
  | FontFeatureSubRule;

/**
 * At-rules that can be nested within style rules.
 *
 * These at-rules support CSS nesting and can appear inside selector blocks.
 *
 * @example
 * ```ts
 * import type { NestableRules } from "./atrules.ts";
 *
 * const media: NestableRules = "@media (min-width: 600px)";
 * const scope: NestableRules = "@scope (.card)";
 * const layer: NestableRules = "@layer components";
 * ```
 *
 * @since 0.0.4
 */
export type NestableRules =
  | MediaRule
  | LayerRule
  | SupportsRule
  | ContainerRule
  | ScopeRule
  | StartingStyleRule;

/**
 * Keyframe offset values.
 *
 * Represents the timing position of a keyframe in an animation:
 * `from` (0%), `to` (100%), or a percentage value.
 *
 * @example
 * ```ts
 * import type { KeyframeOffset } from "./atrules.ts";
 *
 * const start: KeyframeOffset = "from";
 * const end: KeyframeOffset = "to";
 * const mid: KeyframeOffset = "50%";
 * ```
 *
 * @since 0.0.4
 */
export type KeyframeOffset = "from" | "to" | `${number}%`;

/**
 * Font-face descriptor properties.
 *
 * Describes font descriptors for the @font-face at-rule.
 *
 * @example
 * ```ts
 * import type { FontFaceProperties } from "./atrules.ts";
 *
 * const roboto: FontFaceProperties = {
 *   fontFamily: "Roboto",
 *   src: "url('/fonts/roboto.woff2') format('woff2')",
 *   fontWeight: "400",
 *   fontStyle: "normal",
 *   fontDisplay: "swap",
 * };
 * ```
 *
 * @since 0.0.4
 */
export type FontFaceProperties = {
  readonly fontFamily?: string;
  readonly src?: string;
  readonly fontStyle?: string;
  readonly fontWeight?: string | number;
  readonly fontStretch?: string;
  readonly fontDisplay?: "auto" | "block" | "swap" | "fallback" | "optional";
  readonly unicodeRange?: string;
  readonly fontVariant?: string;
  readonly fontFeatureSettings?: string;
  readonly fontVariationSettings?: string;
  readonly ascentOverride?: string;
  readonly descentOverride?: string;
  readonly lineGapOverride?: string;
  readonly sizeAdjust?: string;
};

/**
 * Page pseudo-classes for @page rules.
 *
 * Used to target specific pages in paged media (print).
 *
 * @example
 * ```ts
 * import type { PagePseudo } from "./atrules.ts";
 *
 * const first: PagePseudo = ":first";
 * const left: PagePseudo = ":left";
 * const blank: PagePseudo = ":blank";
 * ```
 *
 * @since 0.0.4
 */
export type PagePseudo = ":first" | ":last" | ":left" | ":right" | ":blank";

/**
 * Property descriptor for @property at-rule.
 *
 * Defines the syntax, inheritance, and initial value for a custom property.
 * The `inherits` value uses string literals for CSS rendering compatibility.
 *
 * @example
 * ```ts
 * import type { PropertyDescriptors } from "./atrules.ts";
 *
 * const colorProperty: PropertyDescriptors = {
 *   syntax: '"<color>"',
 *   inherits: "true",
 *   initialValue: "black",
 * };
 *
 * const lengthProperty: PropertyDescriptors = {
 *   syntax: '"<length>"',
 *   inherits: "false",
 *   initialValue: "0px",
 * };
 * ```
 *
 * @since 0.0.4
 */
export type PropertyDescriptors = {
  readonly syntax: string;
  readonly inherits: "true" | "false";
  readonly initialValue?: string;
};

/**
 * Counter style system values for @counter-style.
 *
 * Defines how counter values are converted to string representations.
 *
 * @example
 * ```ts
 * import type { CounterStyleSystem } from "./atrules.ts";
 *
 * const cyclic: CounterStyleSystem = "cyclic";
 * const numeric: CounterStyleSystem = "numeric";
 * const fixed: CounterStyleSystem = "fixed 5";
 * const extended: CounterStyleSystem = "extends decimal";
 * ```
 *
 * @since 0.0.4
 */
export type CounterStyleSystem =
  | "cyclic"
  | "numeric"
  | "alphabetic"
  | "symbolic"
  | "additive"
  | "fixed"
  | `fixed ${number}`
  | `extends ${string}`;

/**
 * Counter style descriptors for @counter-style at-rule.
 *
 * Configures how a custom counter style renders list markers.
 *
 * @example
 * ```ts
 * import type { CounterStyleDescriptors } from "./atrules.ts";
 *
 * const thumbs: CounterStyleDescriptors = {
 *   system: "cyclic",
 *   symbols: "👍",
 *   suffix: " ",
 * };
 *
 * const alpha: CounterStyleDescriptors = {
 *   system: "alphabetic",
 *   symbols: "a b c d e f g h i j k l m n o p q r s t u v w x y z",
 * };
 * ```
 *
 * @since 0.0.4
 */
export type CounterStyleDescriptors = {
  readonly system?: CounterStyleSystem;
  readonly symbols?: string;
  readonly additiveSymbols?: string;
  readonly negative?: string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly range?: string;
  readonly pad?: string;
  readonly fallback?: string;
  readonly speakAs?: string;
};

/**
 * Font feature value types for @font-feature-values.
 *
 * Specifies which OpenType feature category a named value belongs to.
 *
 * @example
 * ```ts
 * import type { FontFeatureValueType } from "./atrules.ts";
 *
 * const swash: FontFeatureValueType = "swash";
 * const stylistic: FontFeatureValueType = "stylistic";
 * const ornaments: FontFeatureValueType = "ornaments";
 * ```
 *
 * @since 0.0.4
 */
export type FontFeatureValueType =
  | "stylistic"
  | "styleset"
  | "character-variant"
  | "swash"
  | "ornaments"
  | "annotation";

/**
 * Font feature values descriptors for @font-feature-values at-rule.
 *
 * Maps feature types to named values and their OpenType indices.
 *
 * @example
 * ```ts
 * import type { FontFeatureValuesDescriptors } from "./atrules.ts";
 *
 * const features: FontFeatureValuesDescriptors = {
 *   stylistic: { fancy: [1] },
 *   swash: { swoop: [1], swoopier: [2] },
 * };
 * ```
 *
 * @since 0.0.4
 */
export type FontFeatureValuesDescriptors = Partial<
  Record<FontFeatureValueType, Record<string, number[]>>
>;

/**
 * Font palette descriptors for @font-palette-values at-rule.
 *
 * Configures a custom font color palette based on an existing palette.
 *
 * @example
 * ```ts
 * import type { FontPaletteDescriptors } from "./atrules.ts";
 *
 * const warm: FontPaletteDescriptors = {
 *   basePalette: 0,
 *   overrideColors: { 0: "#ff6b6b", 1: "#feca57" },
 * };
 *
 * const darkMode: FontPaletteDescriptors = {
 *   basePalette: "dark",
 * };
 * ```
 *
 * @since 0.0.4
 */
export type FontPaletteDescriptors = {
  readonly basePalette?: number | "light" | "dark";
  readonly overrideColors?: Record<number, string>;
};

/**
 * Rendering intent for @color-profile.
 *
 * Specifies how colors should be mapped when converting between color spaces.
 *
 * @example
 * ```ts
 * import type { ColorProfileRenderingIntent } from "./atrules.ts";
 *
 * const perceptual: ColorProfileRenderingIntent = "perceptual";
 * const saturation: ColorProfileRenderingIntent = "saturation";
 * const relative: ColorProfileRenderingIntent = "relative-colorimetric";
 * ```
 *
 * @since 0.0.4
 */
export type ColorProfileRenderingIntent =
  | "relative-colorimetric"
  | "absolute-colorimetric"
  | "perceptual"
  | "saturation";

/**
 * Color profile descriptors for @color-profile at-rule.
 *
 * Defines an ICC color profile for use with the `color()` function.
 *
 * @example
 * ```ts
 * import type { ColorProfileDescriptors } from "./atrules.ts";
 *
 * const swop: ColorProfileDescriptors = {
 *   src: 'url("/profiles/swop.icc")',
 *   renderingIntent: "relative-colorimetric",
 * };
 * ```
 *
 * @since 0.0.4
 */
export type ColorProfileDescriptors = {
  readonly src: string;
  readonly renderingIntent?: ColorProfileRenderingIntent;
  readonly components?: string;
};

// =============================================================================
// Unnestable At-Rule Function
// =============================================================================

/**
 * Keyframe block properties - maps offset selectors to CSS properties.
 *
 * Used with @keyframes to define animation frames. Keys are keyframe
 * offsets (from, to, or percentages) and values are CSS properties.
 *
 * @example
 * ```ts
 * import type { KeyframeBlockProperties } from "./atrules.ts";
 *
 * const fadeIn: KeyframeBlockProperties = {
 *   from: { opacity: "0" },
 *   to: { opacity: "1" },
 * };
 *
 * const bounce: KeyframeBlockProperties = {
 *   "0%": { transform: "translateY(0)" },
 *   "50%": { transform: "translateY(-20px)" },
 *   "100%": { transform: "translateY(0)" },
 * };
 * ```
 *
 * @since 0.0.8
 */
export type KeyframeBlockProperties = Partial<
  Record<KeyframeOffset, Properties>
>;

/**
 * Font feature values block properties - maps feature types to named values.
 *
 * Used with @font-feature-values to define OpenType feature aliases.
 * Keys are feature sub-rule types (@swash, @styleset, etc.) and values
 * are mappings of names to OpenType indices.
 *
 * @example
 * ```ts
 * import type { FontFeatureValuesBlockProperties } from "./atrules.ts";
 *
 * const brill: FontFeatureValuesBlockProperties = {
 *   "@swash": { elegant: "1" },
 *   "@styleset": { "alt-g": "1", "alt-m": "2" },
 * };
 * ```
 *
 * @since 0.0.8
 */
export type FontFeatureValuesBlockProperties = Partial<
  Record<FontFeatureSubRule, Record<string, string>>
>;

/**
 * Map of unnestable at-rule tags to their flat descriptor property types.
 *
 * These at-rules have block content that consists of property declarations.
 * Some like @keyframes and @font-feature-values use nested block structures
 * which are converted to the appropriate format by the `at` function.
 *
 * @example
 * ```ts
 * import type { FlatAtRuleProperties } from "./atrules.ts";
 *
 * type FontFaceProps = FlatAtRuleProperties["@font-face"];
 * // { fontFamily?: string; src?: string; ... }
 *
 * type KeyframeProps = FlatAtRuleProperties["@keyframes"];
 * // Record<KeyframeOffset, Properties>
 * ```
 *
 * @since 0.0.4
 */
export type FlatAtRuleProperties = {
  "@font-face": FontFaceProperties;
  "@page": Properties;
  "@property": PropertyDescriptors;
  "@counter-style": CounterStyleDescriptors;
  "@color-profile": ColorProfileDescriptors;
  "@keyframes": KeyframeBlockProperties;
  "@-webkit-keyframes": KeyframeBlockProperties;
  "@font-feature-values": FontFeatureValuesBlockProperties;
};

/**
 * Unnestable at-rule strings that have flat descriptor properties.
 *
 * These at-rules contain property declarations in their blocks rather than
 * nested rules or complex structures.
 *
 * @example
 * ```ts
 * import type { FlatAtRule } from "./atrules.ts";
 *
 * const fontFace: FlatAtRule = "@font-face";
 * const page: FlatAtRule = "@page :first";
 * const property: FlatAtRule = "@property --my-color";
 * const counter: FlatAtRule = "@counter-style thumbs";
 * const profile: FlatAtRule = "@color-profile --swop5c";
 * ```
 *
 * @since 0.0.4
 */
export type FlatAtRule =
  | PropertyRule
  | CounterStyleRule
  | ColorProfileRule
  | PageRule
  | FontFaceRule
  | KeyframesRule
  | FontFeatureValuesRule;

/**
 * Extracts the at-rule tag from a full at-rule string.
 *
 * Parses the at-rule prelude to get just the @-keyword portion.
 *
 * @example
 * ```ts
 * import type { ExtractAtRuleTag } from "./atrules.ts";
 *
 * type A = ExtractAtRuleTag<"@font-face">;           // "@font-face"
 * type B = ExtractAtRuleTag<"@keyframes bounce">;    // "@keyframes"
 * type C = ExtractAtRuleTag<"@property --my-color">; // "@property"
 * ```
 *
 * @since 0.0.4
 */
export type ExtractAtRuleTag<T extends string> = T extends
  `${infer Tag} ${string}` ? Tag
  : T;

/**
 * Gets the flat properties type for an unnestable at-rule.
 *
 * Uses the at-rule tag to look up the corresponding properties type
 * from {@link FlatAtRuleProperties}.
 *
 * @example
 * ```ts
 * import type { FlatAtRulePropertiesFor } from "./atrules.ts";
 *
 * type A = FlatAtRulePropertiesFor<"@font-face">;
 * // FontFaceProperties
 *
 * type B = FlatAtRulePropertiesFor<"@property --theme-color">;
 * // PropertyDescriptors
 * ```
 *
 * @since 0.0.4
 */
export type FlatAtRulePropertiesFor<T extends FlatAtRule> =
  ExtractAtRuleTag<T> extends keyof FlatAtRuleProperties
    ? FlatAtRuleProperties[ExtractAtRuleTag<T>]
    : never;

/**
 * Extracts the at-rule keyword from a full at-rule string.
 *
 * @param rule - The full at-rule string
 * @returns The at-rule keyword (e.g., "@keyframes" from "@keyframes bounce")
 *
 * @internal
 * @since 0.0.8
 */
function extractAtRuleKeyword(rule: string): string {
  const spaceIndex = rule.indexOf(" ");
  return spaceIndex === -1 ? rule : rule.slice(0, spaceIndex);
}

/**
 * Converts keyframe block properties to style input with nested selectors.
 *
 * @param properties - Keyframe offset to properties mapping
 * @returns StyleInput with select property for nested rendering
 *
 * @internal
 * @since 0.0.8
 */
function keyframesToStyleInput(
  properties: KeyframeBlockProperties,
): StyleInput {
  const result: Record<string, Record<string, string>> = {};
  for (const [offset, props] of Object.entries(properties)) {
    if (props) {
      const stringProps: Record<string, string> = {};
      for (const [key, value] of Object.entries(props)) {
        stringProps[key] = String(value);
      }
      result[offset] = stringProps;
    }
  }
  return result as unknown as StyleInput;
}

/**
 * Converts font feature values block properties to style input with nested selectors.
 *
 * @param properties - Font feature sub-rule to values mapping
 * @returns Record with nested selectors for rendering
 *
 * @internal
 * @since 0.0.8
 */
function fontFeatureValuesToStyleInput(
  properties: FontFeatureValuesBlockProperties,
): StyleInput {
  const result: Record<string, Record<string, string>> = {};
  for (const [subRule, values] of Object.entries(properties)) {
    if (values) {
      result[subRule] = values;
    }
  }
  return result as unknown as StyleInput;
}

/**
 * Creates a Style from an unnestable at-rule and its descriptor properties.
 *
 * This function provides type-safe creation of at-rule styles by narrowing
 * the properties argument based on the at-rule type. The at-rule string
 * becomes the selector and the properties are rendered as CSS declarations.
 *
 * For @keyframes rules, the properties are keyframe offsets mapped to CSS
 * properties, which are rendered as nested blocks.
 *
 * For @font-feature-values rules, the properties are feature sub-rules
 * mapped to named values, which are rendered as nested blocks.
 *
 * @param rule - The at-rule prelude string (e.g., "@font-face", "@property --my-color")
 * @param properties - The descriptor properties for the at-rule, narrowed by rule type
 * @returns A Style object that can be rendered to CSS
 *
 * @example
 * ```ts
 * import { at, render } from "./atrules.ts";
 *
 * // @font-face with FontFaceProperties
 * const roboto = at("@font-face", {
 *   fontFamily: "Roboto",
 *   src: "url('/fonts/roboto.woff2') format('woff2')",
 *   fontWeight: "400",
 *   fontDisplay: "swap",
 * });
 *
 * // @property with PropertyDescriptors
 * const themeColor = at("@property --theme-color", {
 *   syntax: '"<color>"',
 *   inherits: "true",
 *   initialValue: "blue",
 * });
 *
 * // @counter-style with CounterStyleDescriptors
 * const thumbs = at("@counter-style thumbs", {
 *   system: "cyclic",
 *   symbols: "👍",
 *   suffix: " ",
 * });
 *
 * // @page with CSS Properties
 * const firstPage = at("@page :first", {
 *   marginTop: "2in",
 * });
 *
 * // @color-profile with ColorProfileDescriptors
 * const swop = at("@color-profile --swop5c", {
 *   src: 'url("/profiles/swop.icc")',
 *   renderingIntent: "relative-colorimetric",
 * });
 *
 * // @keyframes with KeyframeBlockProperties
 * const fadeIn = at("@keyframes fade-in", {
 *   from: { opacity: "0" },
 *   to: { opacity: "1" },
 * });
 *
 * // @font-feature-values with FontFeatureValuesBlockProperties
 * const brill = at('@font-feature-values "Brill"', {
 *   "@swash": { elegant: "1" },
 *   "@styleset": { "alt-g": "1" },
 * });
 * ```
 *
 * @since 0.0.4
 */
export function at<T extends FlatAtRule>(
  rule: T,
  properties: FlatAtRulePropertiesFor<T>,
): Style {
  const keyword = extractAtRuleKeyword(rule);

  // Handle @keyframes rules - convert to nested selector format
  if (keyword === "@keyframes" || keyword === "@-webkit-keyframes") {
    return style(
      rule as string,
      keyframesToStyleInput(
        properties as KeyframeBlockProperties,
      ) as StyleInput,
    );
  }

  // Handle @font-feature-values rules - convert to nested selector format
  if (keyword === "@font-feature-values") {
    return style(
      rule as string,
      fontFeatureValuesToStyleInput(
        properties as FontFeatureValuesBlockProperties,
      ) as StyleInput,
    );
  }

  // Cast needed because at-rule selectors and descriptor properties
  // don't match the standard Selector/StyleInput types
  return style(
    rule as string,
    properties as StyleInput,
  );
}
