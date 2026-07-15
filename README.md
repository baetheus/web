# @tub/web [![JSR](https://jsr.io/badges/@tub/web)](https://jsr.io/@tub/web)

A type-safe CSS-in-TypeScript library and no-magic HTTP router for Deno.

`@tub/web` merges two capabilities into one package:

- **CSS**: scoped class generation, CSS variable theming, at-rules, and style
  composition — all at build time with zero runtime overhead.
- **Web server**: a standards-based HTTP router built directly on
  `Deno.ServeHandler`, a directory-based route builder, and a `site()`
  convenience function for full-stack Deno applications.

## Installation

```bash
deno add jsr:@tub/web
```

## CSS

### Basic Styles

```ts
import { render, style } from "@tub/web";

const button = style({
  backgroundColor: "blue",
  color: "white",
  padding: "8px 16px",
  borderRadius: "4px",
});

// Use in DOM
element.className = button.toString();

// Render CSS
const css = render(button);
```

### Nested Selectors

```ts
import { render, style } from "@tub/web";

const card = style({
  padding: "16px",
  transition: "transform 0.2s",
  select: {
    "&:hover": { transform: "scale(1.02)" },
    "& > h2": { marginTop: "0" },
    "@media (min-width: 768px)": { padding: "24px" },
  },
});

console.log(render(card));
```

### Custom Selectors

```ts
import { join, render, style } from "@tub/web";

const body = style("body", { margin: "0", fontFamily: "sans-serif" });
const header = style("#header", { position: "fixed", top: "0" });

console.log(render(join(body, header)));
```

### CSS Variables / Theming

```ts
import { fallback, join, render, style, theme } from "@tub/web";

const colors = theme({
  colors: {
    primary: "blue",
    secondary: "green",
    brand: { light: "#eef", dark: "#335" },
  },
  spacing: "8px",
});

const card = style({
  color: colors.colors.primary,
  backgroundColor: colors.colors.brand.light,
  padding: colors.spacing,
});

const button = style({
  color: colors.colors.primary,
  borderColor: fallback(colors.colors.secondary, "gray"),
});

const lightTheme = style(":root", colors);

const darkColors = colors.create({
  colors: {
    primary: "white",
    secondary: "#ccc",
    brand: { light: "#335", dark: "#eef" },
  },
});
const darkTheme = style(".dark", darkColors);

console.log(render(join(lightTheme, darkTheme, card)));
```

### Combining Styles

```ts
import { render, style, use } from "@tub/web";

const base = style({ padding: "8px" });
const primary = style({ backgroundColor: "blue", color: "white" });
const large = style({ fontSize: "1.25rem" });

const className = use(base, primary, large);
// "abc123 def456 ghi789"
```

### At-Rules

```ts
import { at, join, render } from "@tub/web";

const roboto = at("@font-face", {
  fontFamily: "Roboto",
  src: "url('/fonts/roboto.woff2') format('woff2')",
  fontWeight: "400",
  fontDisplay: "swap",
});

const themeColor = at("@property --theme-color", {
  syntax: '"<color>"',
  inherits: "true",
  initialValue: "blue",
});

const thumbs = at("@counter-style thumbs", {
  system: "cyclic",
  symbols: "👍",
  suffix: " ",
});

console.log(render(join(roboto, themeColor, thumbs)));
```

### Render Options

```ts
import {
  MINIMAL_RENDER_OPTIONS,
  render,
  STANDARD_RENDER_OPTIONS,
  style,
} from "@tub/web";

const button = style({ color: "blue" });

console.log(render(button)); // human-readable
console.log(render(button, STANDARD_RENDER_OPTIONS)); // same as default
console.log(render(button, MINIMAL_RENDER_OPTIONS)); // minified
```

### Reusable Properties

```ts
import { properties, style } from "@tub/web";

const flexCenter = properties({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const card = style({ ...flexCenter, padding: "16px" });
```

### Style Groups

```ts
import { group, render, style } from "@tub/web";

const g = group({
  button: {
    primary: style({ backgroundColor: "blue", color: "white" }),
    secondary: style({ backgroundColor: "gray", color: "black" }),
  },
  text: {
    heading: style({ fontSize: "2rem", fontWeight: "bold" }),
    body: style({ fontSize: "1rem" }),
  },
});

element.className = g.button.primary.toString();
console.log(render(g));
```

---

## Web Server

Deno provides a powerful, standards-compliant HTTP server. Most router modules
still implement patterns from Node.js — untyped middleware, magic `next`
callbacks, and automagical conventions. `@tub/web` takes a different approach:

1. No templating tools or magic project setup.
2. Builds directly on `Deno.ServeHandler` and web standards.
3. Type-safe path parameter parsing at the type level.
4. Composes well enough to implement both SSR and autodocumenting API
   frameworks.

### Manual Router

```ts
import { context, handle, html, router } from "@tub/web/router";

const app = router(context({}), {
  routes: [
    handle("GET /", () => html("<h1>Welcome!</h1>")),
    handle(
      "GET /users/:id",
      (_, params) => html(`<h1>User: ${params.id}</h1>`),
    ),
  ],
});

Deno.serve(app.handle);
```

### Route Files with the Builder

The route builder walks a directory and converts exported tokens into routes.
Place route files anywhere under the root path — the file's path relative to
root becomes the URL pattern.

```ts
// routes/api/users.ts
import { get, post } from "@tub/web/tokens";
import * as R from "@tub/web/router";

// GET /api/users
export const list = get((_req, _params, _ctx) =>
  R.json(JSON.stringify([{ id: 1, name: "Alice" }]))
);

// POST /api/users
export const create = post(async (req, _params, _ctx) => {
  const body = await req.json();
  return R.json(JSON.stringify(body), R.STATUS_CODE.Created);
});
```

```ts
// routes/users/:id.ts
import { del, get } from "@tub/web/tokens";
import * as R from "@tub/web/router";

// GET /users/:id — params.id is type-checked
export const show = get((_req, params, _ctx) =>
  R.json(JSON.stringify({ id: params.id }))
);

// DELETE /users/:id
export const remove = del((_req, _params, _ctx) =>
  R.text("Deleted", R.STATUS_CODE.NoContent)
);
```

### Site Builder (Quickstart)

`site()` is the fastest way to get a full-stack Deno app running. It wires
together the client SPA plugin, server routes plugin, and static file plugin,
then returns a request handler ready for `Deno.serve`.

```ts
import { site } from "@tub/web";

Deno.serve(
  await site({
    root_path: "./src/routes",
    site_name: "My Application",
    unsafe_import: (path) => import(path),
  }),
);
```

### Advanced: Plugins Directly

Use the individual plugins when you need finer control:

```ts
import { build } from "@tub/web/builder";
import { server_plugin } from "@tub/web/plugin_server";
import { static_plugin } from "@tub/web/plugin_static";
import { openapi_plugin } from "@tub/web/plugin_openapi";
import { deno_fs } from "@tub/web/deno_fs";
import { context, router } from "@tub/web/router";

const result = await builder({
  root_path: "./src/routes",
  fs: deno_fs,
  unsafe_import: (path) => import(path),
  plugins: [
    server_plugin({ middleware: [authMiddleware] }),
    static_plugin({ exclude_extensions: [".ts", ".tsx"] }),
    openapi_plugin({ info: { title: "My API", version: "1.0.0" } }),
  ],
}).build();

const app = router(context({}), {
  routes: result.site_routes.map((r) => r.route),
});

Deno.serve(app.handle);
```

### Schema Validation

Route handlers can declare typed params and body schemas. The server plugin
validates incoming requests automatically and returns 400 on failure.

```ts
import { get, post } from "@tub/web/tokens";
import * as R from "@tub/web/router";

export const get_user = get({
  params: (s) => s.struct({ id: s.string() }),
  handler: (_req, params, _body, _ctx) => R.json(JSON.stringify(params)),
});

export const create_user = post({
  body: (s) => s.struct({ name: s.string(), age: s.number() }),
  handler: async (_req, _params, body, _ctx) =>
    R.json(JSON.stringify(body), R.STATUS_CODE.Created),
});
```

### Middleware

```ts
import { middleware } from "@tub/web/router";

const log = middleware((next) => async (req, params, ctx) => {
  ctx.logger.info(`${req.method} ${req.url}`);
  return next(req, params, ctx);
});
```

---

## API Reference

### CSS — Core Functions

- `style(input)` — Creates a Style with an auto-generated class name
- `style(selector, input)` — Creates a Style with a custom selector
- `render(style, options?)` — Renders a HasStyles object to a CSS string
- `join(...styles)` — Combines multiple HasStyles objects into one for rendering
- `use(...styles)` — Combines multiple styles into a class name string
- `properties(input)` — Identity function for type-checked style objects
- `group(shape)` — Creates a StyleGroup from a tree of styles
- `hasStyles(value)` — Type guard for HasStyles objects

### CSS — Theming

- `theme(values)` — Creates a type-safe CSS variable theme
- `Theme.create(partial)` — Creates a variant with merged values
- `fallback(ref, ...values)` — Adds fallback values to a CSS variable reference
- `isTheme(value)` — Type guard for Theme objects

### CSS — At-Rules

- `at(rule, properties)` — Creates styles for unnestable at-rules

### CSS — Render Options

- `STANDARD_RENDER_OPTIONS` — Pretty-printed CSS with newlines and indentation
- `MINIMAL_RENDER_OPTIONS` — Minified CSS with no whitespace

### Router (`@tub/web/router`)

- `router(ctx, config)` — Creates a router instance
- `context(state, logger?)` — Creates a context object for route handlers
- `handle(routeString, handler)` — Type-safe route definition from a string
- `route(method, path, handler)` — Route definition from parts
- `middleware(m)` — Utility for creating typed middleware
- `html(content, status?)` — HTML response helper
- `json(content, status?)` — JSON response helper
- `text(content, status?)` — Plain text response helper
- `response(body, init?)` — Generic response helper
- `response_init(status, headers?, statusText?)` — Creates a ResponseInit
- `STATUS_CODE` — HTTP status code constants
- `STATUS_TEXT` — HTTP status text constants
- `HEADER` — HTTP header name constants
- `METHODS` — HTTP method constants

### Tokens (`@tub/web/tokens`)

Method builders for route files: `get`, `post`, `put`, `del`, `patch`, `head`,
`options`. Each accepts a plain handler or a config object with `params`,
`body`, `output`, and `handler`.

Client page factories for SPA builds: `client_route`, `client_default`,
`client_index`, `client_wrapper`.

### Plugins

- `server_plugin(opts?)` — Scans files for exported tokens and builds routes
- `static_plugin(opts?)` — Serves files directly from the filesystem
- `client_plugin(opts?)` — Bundles Preact components into a client SPA
- `openapi_plugin(opts)` — Generates an OpenAPI 3.1.0 spec from all routes

### Route Builder (`@tub/web/builder`)

- `builder(config)` — Creates a builder that walks a directory and runs plugins

### Filesystem (`@tub/web/deno_fs`)

- `deno_fs` — Deno filesystem implementation for the route builder

---

## Inspirations

- [vanilla-extract](https://vanilla-extract.style/) — Primary inspiration for
  the CSS API design, particularly `style`, theming patterns
- [Sass](https://sass-lang.com/) — Influence on nesting and selector composition
- [fp-ts](https://gcanti.github.io/fp-ts/) — Functional programming patterns
- [Oxide Computer Company's Dropshot](https://github.com/oxidecomputer/dropshot)
  — Inspiration for autodocumenting API design

## Contributing

Contributions are welcome! This is an experimental project.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development

```bash
# Run tests
deno test

# Type check
deno check mod.ts

# Format
deno fmt
```

## License

MIT License - see [LICENSE](./LICENSE) for details.
