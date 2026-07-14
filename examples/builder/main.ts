import { site } from "../../mod.ts";
import { middleware } from "../../router.ts";

// Logging middleware
const logging_middleware = middleware((handler) => {
  return async (req, pattern, ctx) => {
    const start = performance.now();
    ctx.logger.info(`--> ${req.method} ${new URL(req.url).pathname}`);

    const response = await handler(req, pattern, ctx);
    const duration = (performance.now() - start).toFixed(2);
    ctx.logger.info(
      `<-- ${req.method} ${
        new URL(req.url).pathname
      } ${response.status} ${duration}ms`,
    );

    return response;
  };
});

// Build and serve the site
async function main() {
  const handler = await site({
    site_name: "Example Site",
    root_path: "./routes",
    unsafe_import: (path) => import(path),
    middlewares: [logging_middleware],
  });

  const result = Deno.serve(handler);
  console.log(`Server started at ${result.addr}`);
}

await main();
