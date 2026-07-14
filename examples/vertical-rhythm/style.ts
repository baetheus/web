/**
 * Vertical rhythm example using Verdana.
 *
 * Base unit: 1rem font-size × 1.5 line-height = 1.5rem (24px at 16px root).
 * All vertical spacing is expressed as multiples of that base unit.
 */

import { group, render, style, theme } from "../../mod.ts";

export const base = theme({
  font: {
    family: "Verdana, sans-serif",
    size: "16px",
    lineHeight: 2,
  },
  scale: {
    u5: "2em",
    u4: "1.7511em",
    u3: "1.5157em",
    u2: "1.3195em",
    u1: "1.1487em",
    base: "1em",
    d1: "0.8706em",
    d2: "0.7579em",
    d3: "0.6599em",
    d4: "0.5745em",
    d5: "0.5em",
  },
});

export const typography = group({
  theme: style(":root", base),
  base: style("body", {
    fontFamily: base.font.family,
    fontSize: base.font.size,
    lineHeight: base.font.lineHeight,
  }),
  h1: style("h1", { fontSize: base.scale.u3 }),
  h2: style("h2", { fontSize: base.scale.u2 }),
  h3: style("h3", { fontSize: base.scale.u1 }),
  h4: style("h4", { fontSize: base.scale.base }),
  h5: style("h5", { fontSize: base.scale.base }),
  h6: style("h6", { fontSize: base.scale.base }),
  pre: style("pre", { fontSize: base.scale.d1 }),
  small: style("small", { fontSize: base.scale.d1 }),
});

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export const css = render(typography);

if (import.meta.main) {
  console.log(css);
}
