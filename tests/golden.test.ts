import { assertEquals } from "@std/assert";
import { join, MINIMAL_RENDER_OPTIONS, render, style } from "../styles.ts";
import { fallback, theme } from "../themes.ts";

/**
 * Golden test for theme system.
 *
 * Creates a non-trivial design system with:
 * - A complete theme with colors, typography, spacing, and effects
 * - A dark mode variant using create() with partial overrides
 * - 14 style rules using theme variables
 * - Comparison against a static fixture
 */

// Define a comprehensive design system theme
const designSystem = theme(
  {
    colors: {
      primary: "#3b82f6",
      secondary: "#8b5cf6",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      neutral: {
        50: "#fafafa",
        100: "#f5f5f5",
        200: "#e5e5e5",
        700: "#404040",
        800: "#262626",
        900: "#171717",
      },
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        heading: "2rem",
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
      lineHeight: 1.5,
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
    },
    effects: {
      borderRadius: "0.375rem",
      shadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: "150ms ease-in-out",
    },
  },
  "ds", // Use predictable hash for fixture
);

// Create dark mode variant with partial overrides
const darkMode = designSystem.create({
  colors: {
    neutral: {
      50: "#171717",
      100: "#262626",
      200: "#404040",
      700: "#e5e5e5",
      800: "#f5f5f5",
      900: "#fafafa",
    },
  },
});

// Build styles using theme variables
const rootTheme = style(":root", designSystem);
const darkTheme = style(".dark", darkMode);

// Typography styles (3)
const body = style("body", {
  fontFamily: designSystem.typography.fontFamily,
  fontSize: designSystem.typography.fontSize.base,
  lineHeight: designSystem.typography.lineHeight,
  color: designSystem.colors.neutral[900],
  backgroundColor: designSystem.colors.neutral[50],
});

const heading = style("h1", {
  fontSize: designSystem.typography.fontSize.heading,
  fontWeight: designSystem.typography.fontWeight.bold,
  marginBottom: designSystem.spacing.md,
});

const small = style(".text-sm", {
  fontSize: designSystem.typography.fontSize.sm,
});

// Button styles (3)
const btn = style(".btn", {
  padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
  borderRadius: designSystem.effects.borderRadius,
  fontWeight: designSystem.typography.fontWeight.medium,
  transition: designSystem.effects.transition,
});

const btnPrimary = style(".btn-primary", {
  backgroundColor: designSystem.colors.primary,
  color: designSystem.colors.neutral[50],
});

const btnSecondary = style(".btn-secondary", {
  backgroundColor: designSystem.colors.secondary,
  color: designSystem.colors.neutral[50],
});

// Card styles (2)
const card = style(".card", {
  backgroundColor: designSystem.colors.neutral[100],
  borderRadius: designSystem.effects.borderRadius,
  boxShadow: designSystem.effects.shadow,
  padding: designSystem.spacing.lg,
});

const cardHeader = style(".card-header", {
  fontSize: designSystem.typography.fontSize.lg,
  fontWeight: designSystem.typography.fontWeight.medium,
  marginBottom: designSystem.spacing.sm,
});

// Alert styles (3)
const alert = style(".alert", {
  padding: designSystem.spacing.md,
  borderRadius: designSystem.effects.borderRadius,
  marginBottom: designSystem.spacing.md,
});

const alertSuccess = style(".alert-success", {
  backgroundColor: designSystem.colors.success,
  color: designSystem.colors.neutral[50],
});

const alertError = style(".alert-error", {
  backgroundColor: designSystem.colors.error,
  color: designSystem.colors.neutral[50],
});

// Layout styles (2) - using fallback
const container = style(".container", {
  maxWidth: "1200px",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: fallback(designSystem.spacing.md, "1rem"),
  paddingRight: fallback(designSystem.spacing.md, "1rem"),
});

const spacer = style(".spacer", {
  marginTop: designSystem.spacing.xl,
  marginBottom: designSystem.spacing.xl,
});

// Combine all styles (14 selectors total: 2 theme + 12 component styles)
const allStyles = join(
  rootTheme,
  darkTheme,
  body,
  heading,
  small,
  btn,
  btnPrimary,
  btnSecondary,
  card,
  cardHeader,
  alert,
  alertSuccess,
  alertError,
  container,
  spacer,
);

// Expected CSS output (minified for easier comparison)
// Note: .dark only contains the partial overrides (keepParentValues defaults to false)
const EXPECTED_CSS =
  `:root{--ds-colors-primary:#3b82f6;--ds-colors-secondary:#8b5cf6;--ds-colors-success:#22c55e;--ds-colors-warning:#f59e0b;--ds-colors-error:#ef4444;--ds-colors-neutral-50:#fafafa;--ds-colors-neutral-100:#f5f5f5;--ds-colors-neutral-200:#e5e5e5;--ds-colors-neutral-700:#404040;--ds-colors-neutral-800:#262626;--ds-colors-neutral-900:#171717;--ds-typography-fontFamily:Inter, sans-serif;--ds-typography-fontSize-xs:0.75rem;--ds-typography-fontSize-sm:0.875rem;--ds-typography-fontSize-base:1rem;--ds-typography-fontSize-lg:1.125rem;--ds-typography-fontSize-xl:1.25rem;--ds-typography-fontSize-heading:2rem;--ds-typography-fontWeight-normal:400;--ds-typography-fontWeight-medium:500;--ds-typography-fontWeight-bold:700;--ds-typography-lineHeight:1.5;--ds-spacing-xs:0.25rem;--ds-spacing-sm:0.5rem;--ds-spacing-md:1rem;--ds-spacing-lg:1.5rem;--ds-spacing-xl:2rem;--ds-effects-borderRadius:0.375rem;--ds-effects-shadow:0 1px 3px rgba(0,0,0,0.1);--ds-effects-transition:150ms ease-in-out;}.dark{--ds-colors-neutral-50:#171717;--ds-colors-neutral-100:#262626;--ds-colors-neutral-200:#404040;--ds-colors-neutral-700:#e5e5e5;--ds-colors-neutral-800:#f5f5f5;--ds-colors-neutral-900:#fafafa;}body{font-family:var(--ds-typography-fontFamily);font-size:var(--ds-typography-fontSize-base);line-height:var(--ds-typography-lineHeight);color:var(--ds-colors-neutral-900);background-color:var(--ds-colors-neutral-50);}h1{font-size:var(--ds-typography-fontSize-heading);font-weight:var(--ds-typography-fontWeight-bold);margin-bottom:var(--ds-spacing-md);}.text-sm{font-size:var(--ds-typography-fontSize-sm);}.btn{padding:var(--ds-spacing-sm) var(--ds-spacing-md);border-radius:var(--ds-effects-borderRadius);font-weight:var(--ds-typography-fontWeight-medium);transition:var(--ds-effects-transition);}.btn-primary{background-color:var(--ds-colors-primary);color:var(--ds-colors-neutral-50);}.btn-secondary{background-color:var(--ds-colors-secondary);color:var(--ds-colors-neutral-50);}.card{background-color:var(--ds-colors-neutral-100);border-radius:var(--ds-effects-borderRadius);box-shadow:var(--ds-effects-shadow);padding:var(--ds-spacing-lg);}.card-header{font-size:var(--ds-typography-fontSize-lg);font-weight:var(--ds-typography-fontWeight-medium);margin-bottom:var(--ds-spacing-sm);}.alert{padding:var(--ds-spacing-md);border-radius:var(--ds-effects-borderRadius);margin-bottom:var(--ds-spacing-md);}.alert-success{background-color:var(--ds-colors-success);color:var(--ds-colors-neutral-50);}.alert-error{background-color:var(--ds-colors-error);color:var(--ds-colors-neutral-50);}.container{max-width:1200px;margin-left:auto;margin-right:auto;padding-left:var(--ds-spacing-md, 1rem);padding-right:var(--ds-spacing-md, 1rem);}.spacer{margin-top:var(--ds-spacing-xl);margin-bottom:var(--ds-spacing-xl);}`;

Deno.test("golden - design system renders expected CSS", () => {
  const css = render(allStyles, MINIMAL_RENDER_OPTIONS);
  assertEquals(css, EXPECTED_CSS);
});

Deno.test("golden - theme var references are correct", () => {
  assertEquals(designSystem.colors.primary, "var(--ds-colors-primary)");
  assertEquals(
    designSystem.typography.fontSize.base,
    "var(--ds-typography-fontSize-base)",
  );
  assertEquals(designSystem.spacing.md, "var(--ds-spacing-md)");
  assertEquals(
    designSystem.effects.borderRadius,
    "var(--ds-effects-borderRadius)",
  );
});

Deno.test("golden - dark mode preserves references", () => {
  assertEquals(darkMode.colors.primary, designSystem.colors.primary);
  assertEquals(darkMode.colors.neutral[50], designSystem.colors.neutral[50]);
});
