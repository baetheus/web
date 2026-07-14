/**
 * CSS style creation and rendering utilities.
 *
 * This module provides functions for creating type-safe CSS styles with
 * automatic class name generation, nested selectors support, and flexible
 * rendering options. Styles can be combined, rendered to strings, and
 * used as class names in your application.
 *
 * @module
 * @since 0.0.4
 */

import type { Properties } from "csstype";
import type { CssValue } from "./_internal.ts";
import type { RawSelector, Selector } from "./selectors.ts";
import type { Theme, Variables } from "./themes.ts";

import {
  camelToKebab,
  hashObject,
  Styles,
  ThemeVariables,
} from "./_internal.ts";
import { isTheme } from "./themes.ts";

/**
 * Options for controlling CSS output formatting.
 *
 * Allows customization of newlines, indentation, and spacing in rendered CSS.
 *
 * @example
 * ```ts
 * import type { RenderOptions } from "./styles.ts";
 *
 * const minified: RenderOptions = { newline: "", indent: "", space: "" };
 * const pretty: RenderOptions = { newline: "\n", indent: "  ", space: " " };
 * ```
 *
 * @since 0.0.4
 */
export type RenderOptions = {
  readonly newline: string;
  readonly indent: string;
  readonly space: string;
};

/**
 * Standard render options with pretty-printed formatting.
 *
 * Uses newlines, 2-space indentation, and spaces around colons for
 * human-readable CSS output.
 *
 * @example
 * ```ts
 * import { render, style, STANDARD_RENDER_OPTIONS } from "./styles.ts";
 *
 * const btn = style({ color: "red" });
 * render(btn, STANDARD_RENDER_OPTIONS);
 * // .abc1234 {
 * //   color: red;
 * // }
 * ```
 *
 * @since 0.0.4
 */
export const STANDARD_RENDER_OPTIONS: RenderOptions = {
  newline: "\n",
  indent: "  ",
  space: " ",
};

/**
 * Minimal render options for minified CSS output.
 *
 * Removes all whitespace for smallest possible output size.
 *
 * @example
 * ```ts
 * import { render, style, MINIMAL_RENDER_OPTIONS } from "./styles.ts";
 *
 * const btn = style({ color: "red" });
 * render(btn, MINIMAL_RENDER_OPTIONS);
 * // .abc1234{color:red;}
 * ```
 *
 * @since 0.0.4
 */
export const MINIMAL_RENDER_OPTIONS: RenderOptions = {
  newline: "",
  indent: "",
  space: "",
};

/**
 * A mapping of CSS selectors to their style inputs.
 *
 * Used for nested selector definitions within a style block.
 *
 * @example
 * ```ts
 * import type { SelectorInput } from "./styles.ts";
 *
 * const nested: SelectorInput = {
 *   "&:hover": { color: "blue" },
 *   "& > span": { fontWeight: "bold" },
 * };
 * ```
 *
 * @since 0.0.4
 */
export type SelectorInput = { readonly [K in RawSelector]?: StyleInput };

/**
 * Input for defining CSS styles.
 *
 * Combines CSS custom properties (Variables), standard CSS properties,
 * and optional nested selectors.
 *
 * @example
 * ```ts
 * import type { StyleInput } from "./styles.ts";
 *
 * const input: StyleInput = {
 *   "--primary": "blue",
 *   color: "var(--primary)",
 *   padding: "8px",
 *   select: {
 *     "&:hover": { opacity: 0.8 },
 *   },
 * };
 * ```
 *
 * @since 0.0.4
 */
export type StyleInput = Variables & Properties & SelectorInput & {
  readonly [key: string]: CssValue | StyleInput | undefined;
};

/**
 * A single style block containing a selector and its style input.
 *
 * @example
 * ```ts
 * import type { StyleBlock } from "./styles.ts";
 *
 * const block: StyleBlock = {
 *   selector: ".button",
 *   input: { color: "red", padding: "8px" },
 * };
 * ```
 *
 * @since 0.0.4
 */
export type StyleBlock = {
  readonly selector: Selector;
  readonly input: StyleInput;
};

/**
 * A type that can yield StyleBlocks for rendering.
 *
 * Implemented by both Style and StyleGroup to allow unified rendering.
 *
 * @example
 * ```ts
 * import { hasStyles, render } from "./styles.ts";
 *
 * function renderIfStyle(value: unknown): string | undefined {
 *   return hasStyles(value) ? render(value) : undefined;
 * }
 * ```
 *
 * @since 0.0.9
 */
export type HasStyles = {
  readonly [Styles]: () => Generator<StyleBlock>;
};

/**
 * A branded style object containing an iterable of style blocks.
 *
 * Created by the `style()` function. Can be converted to a class name
 * string via `toString()` and rendered to CSS via `render()`.
 *
 * @example
 * ```ts
 * import type { Style } from "./styles.ts";
 * import { style, render } from "./styles.ts";
 *
 * const button: Style = style({ color: "red", padding: "8px" });
 * console.log(button.toString()); // "abc1234"
 * console.log(render(button));    // ".abc1234 { color: red; padding: 8px; }"
 * ```
 *
 * @since 0.0.4
 */
export type Style = HasStyles & {
  /**
   * Returns the class name if the selector is a simple class selector.
   *
   * Returns an empty string if the selector is not a simple class selector
   * (e.g., element selectors, ID selectors, compound selectors).
   *
   * @returns The class name (e.g., "abc1234") or an empty string
   */
  toString(): string;
};

/**
 * Creates a Style object from CSS properties or a Theme.
 *
 * When called with just properties, generates a unique class name based on
 * a hash of the input. When called with a selector and properties, uses
 * the provided selector. When passed a Theme, extracts its CSS custom
 * property declarations.
 *
 * @param input - CSS properties, nested selectors, or a Theme object
 * @returns A Style object that can be rendered to CSS
 *
 * @example
 * ```ts
 * import { style, render, theme } from "./mod.ts";
 *
 * // Auto-generated class name
 * const button = style({
 *   backgroundColor: "blue",
 *   color: "white",
 *   padding: "8px 16px",
 * });
 * console.log(button.toString()); // "abc1234"
 *
 * // Custom selector
 * const heading = style("h1", {
 *   fontSize: "2rem",
 *   fontWeight: "bold",
 * });
 * console.log(heading.toString()); // "h1"
 *
 * // Theme creates CSS custom properties
 * const colors = theme({ primary: "blue" });
 * const themeStyle = style(":root", colors);
 * ```
 *
 * @since 0.0.4
 */
export function style(input: Theme | StyleInput): Style;
/**
 * Creates a Style object with a custom selector.
 *
 * @param selector - The CSS selector to use
 * @param input - CSS properties, nested selectors, or a Theme object
 * @returns A Style object that can be rendered to CSS
 *
 * @since 0.0.4
 */
export function style(selector: Selector, input: Theme | StyleInput): Style;
export function style(
  selectorOrInput: Selector | Theme | StyleInput,
  maybeInput?: Theme | StyleInput,
): Style {
  const block: StyleBlock = maybeInput !== undefined
    ? { selector: selectorOrInput as Selector, input: maybeInput as StyleInput }
    : {
      selector: `.${hashObject(selectorOrInput)}`,
      input: selectorOrInput as StyleInput,
    };

  return {
    [Styles]: function* () {
      yield block;
    },
    toString() {
      return classname(block.selector);
    },
  };
}

/**
 * Extracts the class name from a simple class selector.
 *
 * Returns the class name without the leading dot if the selector is a simple
 * class selector (e.g., ".classname" returns "classname"). Returns an empty
 * string if the selector is not a simple class selector.
 *
 * @param selector - The CSS selector to extract from
 * @returns The class name or an empty string
 *
 * @internal
 * @since 0.0.10
 */
function classname(selector: string): string {
  // Match a simple class selector: dot followed by valid class name characters
  const match = /^\.([a-zA-Z0-9_-]+)$/.exec(selector);
  return match ? match[1] : "";
}

/**
 * Type guard to check if a value implements HasStyles.
 *
 * Returns true for Style, StyleGroup, or any object with a Styles.
 *
 * @param input - The value to check
 * @returns `true` if the value implements HasStyles, `false` otherwise
 *
 * @example
 * ```ts
 * import { style, group, hasStyles } from "./styles.ts";
 *
 * const btn = style({ color: "red" });
 * hasStyles(btn);           // true
 * hasStyles({ color: "red" }); // false
 * hasStyles("string");      // false
 * ```
 *
 * @since 0.0.9
 */
export function hasStyles(input: unknown): input is HasStyles {
  return input !== null &&
    typeof input === "object" &&
    Styles in input;
}

/**
 * Identity function for defining style properties with type checking.
 *
 * Useful for defining reusable style objects that will be spread into
 * other styles, while maintaining full type inference.
 *
 * @param input - CSS properties and optional nested selectors
 * @returns The same input, unchanged
 *
 * @example
 * ```ts
 * import { properties, style } from "./styles.ts";
 *
 * const flexCenter = properties({
 *   display: "flex",
 *   alignItems: "center",
 *   justifyContent: "center",
 * });
 *
 * const card = style({
 *   ...flexCenter,
 *   padding: "16px",
 * });
 * ```
 *
 * @since 0.0.4
 */
export function properties<T extends StyleInput>(input: T): T {
  return input;
}

/**
 * Combines multiple Style objects into a single class name string.
 *
 * Joins the class names of all provided styles with spaces, suitable
 * for use in HTML class attributes.
 *
 * @param styles - One or more Style objects to combine
 * @returns A space-separated string of class names
 *
 * @example
 * ```ts
 * import { style, use } from "./styles.ts";
 *
 * const base = style({ padding: "8px" });
 * const active = style({ backgroundColor: "blue" });
 * const large = style({ fontSize: "1.5rem" });
 *
 * const className = use(base, active, large);
 * // "abc1234 def5678 ghi9012"
 *
 * // In JSX: <button className={use(base, active)}>Click</button>
 * ```
 *
 * @since 0.0.4
 */
export function use(...styles: [Style, ...Style[]]): string {
  return styles.map((s) => s.toString()).join(" ");
}

/**
 * Combines multiple HasStyles objects into a single HasStyles for rendering.
 *
 * Joins multiple styles or variants so they can be rendered together as a
 * single CSS output. This is useful for combining styles before passing to
 * `render()`.
 *
 * @param styles - Two or more HasStyles objects to combine
 * @returns A single HasStyles containing all style blocks
 *
 * @example
 * ```ts
 * import { style, join, render } from "./styles.ts";
 *
 * const button = style({ color: "white", backgroundColor: "blue" });
 * const heading = style("h1", { fontSize: "2rem" });
 *
 * // Combine styles for rendering
 * console.log(render(join(button, heading)));
 * // .abc1234 {
 * //   color: white;
 * //   background-color: blue;
 * // }
 * // h1 {
 * //   font-size: 2rem;
 * // }
 * ```
 *
 * @since 0.0.4
 */
export function join(...styles: [HasStyles, ...HasStyles[]]): HasStyles {
  return {
    [Styles]: function* () {
      for (const s of styles) {
        yield* s[Styles]();
      }
    },
  };
}

/**
 * Renders a single CSS property declaration.
 *
 * Converts camelCase property names to kebab-case, preserving custom
 * properties (--*) and at-rules (@*) as-is.
 *
 * @param key - The property name (camelCase or kebab-case)
 * @param value - The property value
 * @param depth - Indentation depth (default: 0)
 * @param options - Render options for formatting
 * @returns A formatted CSS property declaration string
 *
 * @internal
 * @since 0.0.4
 */
function renderProperty(
  key: string,
  value: CssValue,
  depth: number = 0,
  { indent, space }: RenderOptions = STANDARD_RENDER_OPTIONS,
): string {
  const _key = key.startsWith("--") || key.startsWith("@")
    ? key
    : camelToKebab(key);
  return `${indent.repeat(depth)}${_key}:${space}${value};`;
}

/**
 * Type guard to check if a value is a CSS value (string or number).
 *
 * @param value - The value to check
 * @returns `true` if the value is a string or number, `false` otherwise
 *
 * @internal
 * @since 0.0.4
 */
function isCssValue(value: unknown): value is CssValue {
  const _type = typeof value;
  return _type === "string" || _type === "number";
}

/**
 * Renders nested selector blocks.
 *
 * Recursively renders each nested selector and its styles at the
 * appropriate indentation depth.
 *
 * @param input - The nested selector mapping
 * @param depth - Current indentation depth (default: 0)
 * @param options - Render options for formatting
 * @returns Formatted CSS for all nested selectors
 *
 * @internal
 * @since 0.0.4
 */
function renderProperties(
  input: StyleInput,
  depth: number = 0,
  options: RenderOptions = STANDARD_RENDER_OPTIONS,
): string {
  type Props = Properties & Variables & SelectorInput;
  const { newline } = options;
  const _properties = isTheme(input) ? input[ThemeVariables] as Props : input;
  return Object.entries(_properties).filter(([_, i]) => i !== undefined).map((
    [key, value],
  ) =>
    isCssValue(value)
      ? renderProperty(key, value, depth + 1, options)
      : renderBlock({ selector: key, input: value }, depth + 1, options)
  ).join(newline);
}

/**
 * Renders a StyleBlock to a CSS rule string.
 *
 * Formats the selector, all properties, and any nested selectors
 * according to the provided render options.
 *
 * @param block - The StyleBlock to render
 * @param depth - Current indentation depth (default: 0)
 * @param options - Render options for formatting
 * @returns A complete CSS rule block string
 *
 * @internal
 * @since 0.0.4
 */
function renderBlock(
  block: StyleBlock,
  depth: number = 0,
  options: RenderOptions = STANDARD_RENDER_OPTIONS,
): string {
  const { newline, space, indent } = options;
  const { selector, input } = block;
  const _props = renderProperties(input, depth, options);
  const _indent = indent.repeat(depth);
  return `${_indent}${selector}${space}{${newline}${_props}${newline}${_indent}}`;
}

/**
 * Renders a HasStyles object to a CSS string.
 *
 * Iterates over all style blocks and renders each one.
 * Use `join()` to combine multiple styles before rendering.
 *
 * @param style - The HasStyles object to render (Style, StyleGroup, or joined)
 * @param options - Render options for formatting (optional)
 * @returns A complete CSS string with all rules
 *
 * @example
 * ```ts
 * import { style, join, render, MINIMAL_RENDER_OPTIONS } from "./styles.ts";
 *
 * const button = style({ color: "white", backgroundColor: "blue" });
 * const heading = style("h1", { fontSize: "2rem" });
 *
 * // Standard formatting (default)
 * console.log(render(join(button, heading)));
 * // .abc1234 {
 * //   color: white;
 * //   background-color: blue;
 * // }
 * // h1 {
 * //   font-size: 2rem;
 * // }
 *
 * // Minified output
 * console.log(render(button, MINIMAL_RENDER_OPTIONS));
 * // .abc1234{color:white;background-color:blue;}
 * ```
 *
 * @since 0.0.4
 */
export function render(
  style: HasStyles,
  options: RenderOptions = STANDARD_RENDER_OPTIONS,
): string {
  return Array.from(style[Styles]())
    .map((block) => renderBlock(block, 0, options))
    .join(options.newline);
}

// =============================================================================
// StyleGroup
// =============================================================================

/**
 * Recursive shape type for defining a tree of styles.
 *
 * `Style` marks a leaf, nested objects mark groups.
 *
 * @example
 * ```ts
 * import type { GroupShape } from "./styles.ts";
 * import { style } from "./styles.ts";
 *
 * const shape: GroupShape = {
 *   button: {
 *     primary: style({ backgroundColor: "blue" }),
 *     secondary: style({ backgroundColor: "gray" }),
 *   },
 *   text: style({ color: "black" }),
 * };
 * ```
 *
 * @since 0.0.9
 */
export type GroupShape = {
  readonly [key: string]: GroupShape | Style;
};

/**
 * A style group object that provides access to a tree of styles.
 *
 * Implements HasStyles, so it can be passed directly to `render()` to
 * output all contained styles.
 *
 * @example
 * ```ts
 * import { style, group, render } from "./styles.ts";
 *
 * const g = group({
 *   button: {
 *     primary: style({ backgroundColor: "blue" }),
 *     secondary: style({ backgroundColor: "gray" }),
 *   },
 * });
 *
 * // Access individual styles
 * const className = g.button.primary.toString();
 *
 * // Render all styles
 * console.log(render(g));
 * ```
 *
 * @since 0.0.9
 */
export type StyleGroup<T extends GroupShape> = T & HasStyles;

/**
 * Recursively yields all StyleBlocks from a GroupShape.
 *
 * @param shape - The group shape to walk
 * @yields StyleBlock objects from all leaf styles
 *
 * @internal
 * @since 0.0.9
 */
function* walkGroup(shape: GroupShape): Generator<StyleBlock> {
  for (const key in shape) {
    const value = shape[key];
    if (hasStyles(value)) {
      yield* value[Styles]();
    } else {
      yield* walkGroup(value);
    }
  }
}

/**
 * Creates a StyleGroup from a tree of styles.
 *
 * The group provides direct access to nested styles via dot notation
 * and implements HasStyles for rendering all contained styles at once.
 *
 * @param shape - An object defining the style tree structure
 * @returns A StyleGroup with the same shape plus HasStyles capability
 *
 * @example
 * ```ts
 * import { style, group, render } from "./styles.ts";
 *
 * const g = group({
 *   button: {
 *     primary: style({ backgroundColor: "blue", color: "white" }),
 *     secondary: style({ backgroundColor: "gray", color: "black" }),
 *   },
 *   text: {
 *     heading: style({ fontSize: "2rem", fontWeight: "bold" }),
 *     body: style({ fontSize: "1rem" }),
 *   },
 * });
 *
 * // Access individual styles for use in HTML
 * console.log(g.button.primary.toString()); // "abc1234"
 *
 * // Render all styles to CSS
 * console.log(render(g));
 * ```
 *
 * @since 0.0.9
 */
export function group<T extends GroupShape>(shape: T): StyleGroup<T> {
  const result = { ...shape };

  Object.defineProperty(result, Styles, {
    value: function* (): Generator<StyleBlock> {
      yield* walkGroup(shape);
    },
    enumerable: false,
  });

  return result as StyleGroup<T>;
}
