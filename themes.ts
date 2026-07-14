/**
 * CSS variable themes and utilities.
 *
 * This module provides a type-safe system for defining and using CSS custom
 * properties (variables). The Theme class allows you to define the shape
 * and values of your CSS variables once and get type-checked references
 * throughout your codebase.
 *
 * @module
 * @since 0.0.8
 */

import {
  type CssValue,
  hashObject,
  ThemeHash,
  ThemeReferences,
  ThemeValues,
  ThemeVariables,
} from "./_internal.ts";

// =============================================================================
// Properties and Variables
// =============================================================================

/**
 * A CSS custom property key (must start with `--`).
 *
 * @example
 * ```ts
 * import type { VariableKey } from "./themes.ts";
 *
 * const primary: VariableKey = "--primary-color";
 * const spacing: VariableKey = "--spacing-unit";
 * ```
 *
 * @since 0.0.4
 */
export type VariableKey = `--${string}`;

/**
 * A CSS var() function reference to a custom property.
 *
 * @example
 * ```ts
 * import type { VariableValue } from "./themes.ts";
 *
 * const ref: VariableValue = "var(--primary-color)";
 * const withFallback: VariableValue = "var(--primary-color, blue)";
 * ```
 *
 * @since 0.0.4
 */
export type VariableValue = `var(${VariableKey})`;

/**
 * A partial record of CSS custom properties and their values.
 *
 * Used to define CSS variable declarations in style objects.
 *
 * @example
 * ```ts
 * import type { Variables } from "./themes.ts";
 *
 * const vars: Variables = {
 *   "--primary-color": "blue",
 *   "--spacing": "8px",
 *   "--font-size": 16,
 * };
 * ```
 *
 * @since 0.0.4
 */
export type Variables = { readonly [_ in VariableKey]?: CssValue };

// =============================================================================
// Shape Types
// =============================================================================

/**
 * Recursive shape type for defining CSS variable structure with values.
 *
 * `CssValue` (string | number) marks a CSS variable leaf, nested objects mark groups.
 *
 * @example
 * ```ts
 * import type { ThemeShape } from "./themes.ts";
 *
 * const shape: ThemeShape = {
 *   colors: {
 *     primary: "blue",
 *     brand: {
 *       light: "#eef",
 *       dark: "#335",
 *     },
 *   },
 *   spacing: "8px",
 * };
 * ```
 *
 * @since 0.0.8
 */
export type ThemeShape = {
  readonly [key: string]: CssValue | ThemeShape;
};

/**
 * Deep partial type for ThemeShape - allows partial updates at any nesting level.
 *
 * @since 0.0.8
 */
export type DeepPartial<T extends ThemeShape> = {
  readonly [K in keyof T]?: T[K] extends ThemeShape ? DeepPartial<T[K]>
    : CssValue;
};

/**
 * Recursively transform a ThemeShape to have a different value type at each leaf.
 *
 * @since 0.0.8
 */
export type MapShape<T extends ThemeShape, I> = {
  readonly [K in keyof T]: T[K] extends ThemeShape ? MapShape<T[K], I> : I;
};

// =============================================================================
// Internal Utilities
// =============================================================================

/**
 * Type guard to check if a value is a CssValue (leaf) or a nested ThemeShape.
 *
 * @param value - The value to check
 * @returns `true` if the value is a string or number (leaf), `false` if nested
 *
 * @internal
 * @since 0.0.8
 */
function isLeaf(value: CssValue | ThemeShape): value is CssValue {
  return typeof value === "string" || typeof value === "number";
}

/**
 * Recursively walks a shape, calling onLeaf for each leaf value.
 *
 * @param shape - The shape structure to walk
 * @param onLeaf - Callback invoked for each leaf with value and path
 * @param path - Current path in the shape (used internally)
 * @returns A new shape with transformed leaf values
 *
 * @since 0.0.8
 */
export function walkShape<T extends ThemeShape, I>(
  shape: T,
  onLeaf: (value: CssValue, path: string[]) => I,
  path: string[] = [],
): MapShape<T, I> {
  const out: Record<string, unknown> = {};
  for (const key in shape) {
    const value = shape[key];
    const _path = [...path, key];
    if (isLeaf(value)) {
      out[key] = onLeaf(value, _path);
    } else {
      out[key] = walkShape(value, onLeaf, _path);
    }
  }
  return out as MapShape<T, I>;
}

/**
 * Deep merge two shapes, with source values overriding target values.
 *
 * Recursively merges nested shapes, preserving unspecified keys from target.
 *
 * @param target - The base shape to merge into
 * @param source - The partial shape with override values
 * @returns A new shape with merged values
 *
 * @internal
 * @since 0.0.8
 */
function deepMerge<T extends ThemeShape>(target: T, source: DeepPartial<T>): T {
  const out: Record<string, CssValue | ThemeShape> = {};
  for (const key in target) {
    const targetValue = target[key];
    const sourceValue = source[key as keyof typeof source];
    if (sourceValue === undefined) {
      out[key] = targetValue;
    } else if (isLeaf(targetValue)) {
      out[key] = sourceValue as CssValue;
    } else {
      out[key] = deepMerge(targetValue, sourceValue as DeepPartial<ThemeShape>);
    }
  }
  return out as T;
}

/**
 * Recursively builds var() references for a shape.
 *
 * Transforms each leaf value into a CSS var() function reference
 * using the provided hash as a prefix for variable naming.
 *
 * @param shape - The theme shape to transform
 * @param hash - The hash prefix for variable names
 * @returns A shape with var() references at each leaf
 *
 * @internal
 * @since 0.0.8
 */
function buildReferences<T extends ThemeShape>(
  shape: T,
  hash: string,
): MapShape<T, VariableValue> {
  return walkShape(
    shape,
    (_, path) => `var(--${hash}-${path.join("-")})` as VariableValue,
  );
}

/**
 * Builds a flat Variables object from a shape and hash.
 *
 * Flattens the nested shape structure into CSS custom property
 * declarations with hyphenated paths as variable names.
 *
 * @param shape - The theme shape to flatten
 * @param hash - The hash prefix for variable names
 * @returns A flat record of CSS custom properties to values
 *
 * @internal
 * @since 0.0.8
 */
function buildVariables<T extends ThemeShape>(
  shape: T,
  hash: string,
): Variables {
  const result: Record<string, CssValue> = {};
  walkShape(
    shape,
    (value, path) => result[`--${hash}-${path.join("-")}`] = value,
  );
  return result;
}

type ThemeCreateOptions = { readonly keepParentValues: boolean };
const DEFAULT_THEME_CREATE_OPTIONS: ThemeCreateOptions = {
  keepParentValues: false,
};

/**
 * Internal theme constructor from plain object properties.
 *
 * @param props - Object with string keys for all Theme properties
 * @returns A fully constructed Theme object
 *
 * @internal
 * @since 0.0.8
 */
function _theme<T extends ThemeShape>(props: {
  hash: string;
  values: T;
  references: MapShape<T, VariableValue>;
  variables: Variables;
}): Theme<T> {
  const { hash, values, references, variables } = props;

  const result = { ...references };

  Object.defineProperties(result, {
    [ThemeHash]: { value: hash, enumerable: false },
    [ThemeValues]: { value: values, enumerable: false },
    [ThemeReferences]: { value: references, enumerable: false },
    [ThemeVariables]: { value: variables, enumerable: false },
    create: {
      value: (
        partial: DeepPartial<T>,
        options?: Partial<ThemeCreateOptions>,
      ) => {
        const { keepParentValues } = {
          ...DEFAULT_THEME_CREATE_OPTIONS,
          ...options,
        };
        const mergedValues = keepParentValues
          ? deepMerge(values, partial)
          : partial as T;
        return _theme({
          hash,
          values: mergedValues,
          references,
          variables: buildVariables(mergedValues, hash),
        });
      },
      enumerable: false,
    },
  });

  return result as Theme<T>;
}

// deno-lint-ignore ban-types
export type Theme<T extends ThemeShape = {}> =
  & MapShape<T, VariableValue>
  & {
    readonly [ThemeHash]: string;
    readonly [ThemeValues]: T;
    readonly [ThemeReferences]: MapShape<T, VariableValue>;
    readonly [ThemeVariables]: Variables;

    /**
     * Creates a new theme with merged values, preserving the same variable names.
     *
     * By default, only the provided partial values are included in the CSS output,
     * relying on CSS cascade for inherited values. Set `keepParentValues: true`
     * to include all parent values in the output for standalone themes.
     *
     * @param partial - A deep partial of the theme's shape with values to override
     * @param options - Configuration options
     * @param options.keepParentValues - If true, includes all parent values in output (default: false)
     * @returns A new Theme with the same hash but merged values
     *
     * @example
     * ```ts
     * import { theme, style, render, join } from "./mod.ts";
     *
     * const colors = theme({
     *   primary: "blue",
     *   secondary: "green",
     * });
     *
     * // Delta variant - only outputs changed values, relies on cascade
     * const darkColors = colors.create({ primary: "white" });
     *
     * // Standalone variant - outputs all values
     * const standaloneDark = colors.create({ primary: "white" }, { keepParentValues: true });
     *
     * const lightTheme = style(":root", colors);
     * const darkTheme = style(".dark", darkColors);
     * ```
     */
    create(partial: DeepPartial<T>, options?: ThemeCreateOptions): Theme<T>;
  };

/**
 * Creates a CSS variable theme from a shape with values.
 *
 * The theme provides `var()` references for use in styles. Pass the theme
 * directly to `style()` to generate CSS custom property declarations.
 *
 * @param values - An object defining the variable structure and initial values
 * @param hash - Optional custom hash for variable naming (auto-generated if omitted)
 * @returns A Theme with var() references and a `create` method for variants
 *
 * @example
 * ```ts
 * import { theme, style, render, join } from "./mod.ts";
 *
 * // Define theme with values
 * const colors = theme({
 *   primary: "blue",
 *   secondary: "green",
 *   brand: {
 *     light: "#eef",
 *     dark: "#335",
 *   },
 * });
 *
 * // Use var references in styles
 * const button = style({
 *   color: colors.primary,
 *   backgroundColor: colors.brand.light,
 * });
 *
 * // Create CSS custom properties by passing theme to style()
 * const lightTheme = style(":root", colors);
 *
 * // Create a dark variant with same variable names using create()
 * const darkColors = colors.create({
 *   primary: "white",
 *   brand: { light: "#335", dark: "#eef" },
 * });
 * const darkTheme = style(".dark", darkColors);
 *
 * console.log(render(join(lightTheme, darkTheme, button)));
 * ```
 *
 * @since 0.0.8
 */
export function theme<T extends ThemeShape>(
  values: T,
  hash?: string,
): Theme<T> {
  const _hash = hash ?? hashObject(values);
  return _theme({
    hash: _hash,
    values,
    references: buildReferences(values, _hash),
    variables: buildVariables(values, _hash),
  });
}

/**
 * Type guard to check if a value is a Theme object.
 *
 * @param value - The value to check
 * @returns `true` if the value is a Theme, `false` otherwise
 *
 * @example
 * ```ts
 * import { theme, isTheme } from "./themes.ts";
 *
 * const colors = theme({ primary: "blue" });
 * isTheme(colors);                    // true
 * isTheme({ primary: "blue" });       // false
 * ```
 *
 * @since 0.0.8
 */
export function isTheme(value: unknown): value is Theme {
  return value !== null && typeof value === "object" && ThemeHash in value;
}

/**
 * Adds fallback values to a CSS variable reference.
 *
 * @param ref - A CSS var() reference
 * @param values - Fallback values to use if the variable is undefined
 * @returns A var() reference with fallbacks
 *
 * @example
 * ```ts
 * import { theme, fallback, style } from "./mod.ts";
 *
 * const colors = theme({ primary: "blue" });
 *
 * const button = style({
 *   color: colors.primary,                        // "var(--hash-primary)"
 *   background: fallback(colors.primary, "red"),  // "var(--hash-primary, red)"
 * });
 * ```
 *
 * @since 0.0.8
 */
export function fallback(ref: VariableValue, ...values: CssValue[]): string {
  const name = ref.slice(4, -1);
  return `var(${name}, ${values.join(", ")})`;
}
