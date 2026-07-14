/**
 * Type-safe CSS-in-TypeScript and web server library for Deno.
 *
 * `@tub/web` combines two capabilities in a single package:
 *
 * - **CSS**: scoped style generation, CSS variable theming, at-rules, and
 *   style composition — all at build time with zero runtime overhead.
 * - **Web server**: a no-magic HTTP router built on web standards, a
 *   directory-based route builder, and a `site()` convenience function that
 *   wires everything together for full-stack Deno applications.
 *
 * This entry point (`mod.ts`) re-exports the CSS utilities and the top-level
 * `site()` builder. Use the sub-path exports for the router and plugins:
 * `@tub/web/router`, `@tub/web/tokens`, `@tub/web/plugin_server`, etc.
 *
 * @example CSS — basic styles
 * ```ts
 * import { style, render, use } from "@tub/web";
 *
 * const button = style({
 *   backgroundColor: "blue",
 *   color: "white",
 *   padding: "8px 16px",
 *   borderRadius: "4px",
 * });
 *
 * console.log(button.toString()); // "a1b2c3d4"
 * console.log(render(button));
 * // .a1b2c3d4 {
 * //   background-color: blue;
 * //   color: white;
 * //   padding: 8px 16px;
 * //   border-radius: 4px;
 * // }
 * ```
 *
 * @example CSS — nested selectors and pseudo-classes
 * ```ts
 * import { style, render } from "@tub/web";
 *
 * const card = style({
 *   padding: "16px",
 *   transition: "transform 0.2s",
 *   "&:hover": { transform: "scale(1.02)" },
 *   "& > h2": { marginTop: 0 },
 *   "@media (min-width: 768px)": { padding: "24px" },
 * });
 * ```
 *
 * @example CSS — type-safe themes
 * ```ts
 * import { theme, style, render, fallback, join } from "@tub/web";
 *
 * const colors = theme({
 *   primary: "blue",
 *   background: "white",
 *   spacing: { small: "4px", medium: "16px" },
 * });
 *
 * const card = style({
 *   backgroundColor: colors.background,
 *   padding: colors.spacing.medium,
 *   borderColor: fallback(colors.primary, "gray"),
 * });
 *
 * const lightTheme = style(":root", colors);
 * const darkColors = colors.create({ primary: "lightblue", background: "#1a1a1a" });
 * const darkTheme = style(".dark", darkColors);
 *
 * console.log(render(join(lightTheme, darkTheme, card)));
 * ```
 *
 * @example CSS — at-rules
 * ```ts
 * import { at, join, render } from "@tub/web";
 *
 * const roboto = at("@font-face", {
 *   fontFamily: "Roboto",
 *   src: "url('/fonts/roboto.woff2') format('woff2')",
 *   fontWeight: "400",
 *   fontDisplay: "swap",
 * });
 *
 * console.log(render(roboto));
 * ```
 *
 * @example Web server — site builder
 * ```ts
 * import { site } from "@tub/web";
 *
 * Deno.serve(await site({
 *   root_path: "./src/routes",
 *   site_name: "My Application",
 *   unsafe_import: (path) => import(path),
 * }));
 * ```
 *
 * @example Web server — manual router
 * ```ts
 * import { router, context, handle, html } from "@tub/web/router";
 *
 * const app = router(context({}), {
 *   routes: [
 *     handle("GET /", () => html("<h1>Hello!</h1>")),
 *     handle("GET /users/:id", (_, params) => html(`<p>User: ${params.id}</p>`)),
 *   ],
 * });
 *
 * Deno.serve(app.handle);
 * ```
 *
 * @module
 * @since 0.0.4
 */

export type { HasStyles, RenderOptions, Style, StyleGroup } from "./styles.ts";
export type { Theme, Variables } from "./themes.ts";
export type { CSSAtRule } from "./atrules.ts";

export {
  group,
  hasStyles,
  join,
  MINIMAL_RENDER_OPTIONS,
  properties,
  render,
  STANDARD_RENDER_OPTIONS,
  style,
  use,
} from "./styles.ts";
export { fallback, isTheme, theme } from "./themes.ts";
export { at } from "./atrules.ts";
export { site } from "./site.ts";
