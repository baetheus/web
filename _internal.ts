/**
 * Internal utilities for the CSS library.
 *
 * This module provides low-level hashing and string transformation functions
 * used by other modules in the library. These are implementation details and
 * should not be relied upon for external use.
 *
 * @module
 * @since 0.0.4
 */

/**
 * Symbol key for storing the theme's hash identifier.
 * @internal
 * @since 0.0.8
 */
export const ThemeHash = Symbol("@baetheus/css/theme/hash");

/**
 * Symbol key for storing the theme's original shape values.
 * @internal
 * @since 0.0.8
 */
export const ThemeValues = Symbol("@baetheus/css/theme/values");

/**
 * Symbol key for storing the theme's flattened CSS variables.
 * @internal
 * @since 0.0.8
 */
export const ThemeVariables = Symbol("@baetheus/css/theme/variables");

/**
 * Symbol key for storing the theme's var() reference mappings.
 * @internal
 * @since 0.0.8
 */
export const ThemeReferences = Symbol("@baetheus/css/theme/references");

/**
 * Symbol key for accessing style block generators.
 * Used by Style, Variant, and any type implementing HasStyles.
 * @internal
 * @since 0.0.9
 */
export const Styles = Symbol("@baetheus/css/style");

/**
 * A CSS value that can be either a string or number.
 *
 * @example
 * ```ts
 * import type { CssValue } from "./_internal.ts";
 *
 * const color: CssValue = "red";
 * const fontSize: CssValue = 16;
 * const padding: CssValue = "8px";
 * ```
 *
 * @since 0.0.4
 */
export type CssValue = string | number;

/**
 * DJB2 hash - fast, simple, good distribution.
 *
 * A non-cryptographic hash function that produces a 32-bit unsigned integer.
 * Used internally for generating unique class names from style objects.
 *
 * @param str - The string to hash
 * @returns A 32-bit unsigned integer hash value
 *
 * @example
 * ```ts
 * import { djb2 } from "./_internal.ts";
 *
 * djb2("hello"); // 261238937
 * djb2("world"); // 279393645
 * ```
 *
 * @internal
 * @since 0.0.4
 */
export function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Hash any value to a 7-character base36 string.
 *
 * Serializes the input to JSON and computes a DJB2 hash, then converts
 * to a zero-padded base36 string. Used to generate deterministic,
 * collision-resistant class names from style objects.
 *
 * @param input - Any JSON-serializable value to hash
 * @returns An 8-character hash string (letter prefix + 7 base36 digits)
 *
 * @example
 * ```ts
 * import { hashObject } from "./_internal.ts";
 *
 * hashObject({ color: "red" });  // "h0a1b2c3"
 * hashObject([1, 2, 3]);         // "hx7y8z9a"
 * hashObject("hello");           // "h1kf3a9r"
 * ```
 *
 * @since 0.0.4
 */
export function hashObject(input: unknown): string {
  const content = JSON.stringify(input);
  const hash = djb2(content);
  return "h" + hash.toString(36).padStart(7, "0"); // 8 chars, letter prefix
}

/**
 * Converts a camelCase string to kebab-case.
 *
 * Used to transform JavaScript-style CSS property names (e.g., `backgroundColor`)
 * into their CSS equivalents (e.g., `background-color`).
 *
 * @param str - The camelCase string to convert
 * @returns The kebab-case equivalent
 *
 * @example
 * ```ts
 * import { camelToKebab } from "./_internal.ts";
 *
 * camelToKebab("backgroundColor"); // "background-color"
 * camelToKebab("fontSize");        // "font-size"
 * camelToKebab("borderTopWidth");  // "border-top-width"
 * ```
 *
 * @since 0.0.4
 */
export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
