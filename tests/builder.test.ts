import { assertEquals } from "@std/assert";
import * as Path from "@std/path";
import * as Either from "@baetheus/fun/either";
import * as Effect from "@baetheus/fun/effect";
import * as Option from "@baetheus/fun/option";
import * as Schemable from "@baetheus/fun/schemable";

import * as RouteBuilder from "../builder.ts";
import * as Router from "../router.ts";
import * as Tokens from "../tokens.ts";

// ============================================================================
// In-Memory Mock Filesystem
// ============================================================================

type MockFile = {
  readonly content: Uint8Array;
  readonly mimeType: string | undefined;
};

export function createMockFilesystem(
  files: Record<string, MockFile> = {},
): RouteBuilder.Filesystem {
  const storage = new Map<string, MockFile>(Object.entries(files));
  let tempCounter = 0;

  return {
    makeTempFile: async (options) => {
      const suffix = options?.suffix ?? "";
      const prefix = options?.prefix ?? "tmp";
      const dir = options?.dir ?? "/tmp";
      const filename = `${prefix}${tempCounter++}${suffix}`;
      const path = `${dir}/${filename}`;
      storage.set(path, { content: new Uint8Array(), mimeType: undefined });
      return path;
    },

    walk: async (root) => {
      const entries: RouteBuilder.FileEntry[] = [];
      for (const [filePath, file] of storage.entries()) {
        if (filePath.startsWith(root)) {
          const parsed_path = Path.parse(filePath);
          const relative_path = filePath.slice(root.length);
          entries.push(
            RouteBuilder.file_entry(
              parsed_path,
              relative_path,
              Option.fromNullable(file.mimeType),
            ),
          );
        }
      }
      return entries;
    },

    read: async (path) => {
      const filePath = Path.format(path);
      const file = storage.get(filePath);
      if (!file) {
        throw new Error(`File not found: ${filePath}`);
      }
      return new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
          const buffer = new ArrayBuffer(file.content.length);
          const arr = new Uint8Array(buffer);
          arr.set(file.content);
          controller.enqueue(arr);
          controller.close();
        },
      });
    },

    write: async (path, data) => {
      const filePath = Path.format(path);
      let content: Uint8Array;
      if (data instanceof Uint8Array) {
        content = data;
      } else {
        const reader = data.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        content = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          content.set(chunk, offset);
          offset += chunk.length;
        }
      }
      const existing = storage.get(filePath);
      storage.set(filePath, {
        content,
        mimeType: existing?.mimeType,
      });
    },
  };
}

export function mockFile(
  content: string | Uint8Array,
  mimeType?: string,
): MockFile {
  return {
    content: typeof content === "string"
      ? new TextEncoder().encode(content)
      : content,
    mimeType,
  };
}

function unsafe_import(path: string): Promise<unknown> {
  return import(path);
}

// ============================================================================
// file_entry tests
// ============================================================================

Deno.test("file_entry - creates FileEntry with leading slash", () => {
  const parsed = Path.parse("/root/dir/file.ts");
  const entry = RouteBuilder.file_entry(parsed, "dir/file.ts", Option.none);

  assertEquals(entry.relative_path, "/dir/file.ts");
  assertEquals(entry.absolute_path, "/root/dir/file.ts");
  assertEquals(entry.parsed_path, parsed);
  assertEquals(entry.mime_type, undefined);
});

Deno.test("file_entry - preserves leading slash if present", () => {
  const parsed = Path.parse("/root/dir/file.ts");
  const entry = RouteBuilder.file_entry(parsed, "/dir/file.ts", Option.none);

  assertEquals(entry.relative_path, "/dir/file.ts");
});

Deno.test("file_entry - includes mime type when provided", () => {
  const parsed = Path.parse("/root/styles.css");
  const entry = RouteBuilder.file_entry(
    parsed,
    "/styles.css",
    Option.some("text/css"),
  );

  assertEquals(entry.mime_type, Option.some("text/css"));
});

// ============================================================================
// full_route tests
// ============================================================================

Deno.test("full_route - creates FullRoute with correct properties", () => {
  const parsed = Path.parse("/root/api/users.ts");
  const handler: Router.Handler = () => Router.text("OK");
  const schemable_unknown = Schemable.schema((s) => s.unknown());
  const r = Router.route("GET", "/api/users", handler);

  const fullRoute = RouteBuilder.full_route(
    "TestPlugin",
    parsed,
    r,
    schemable_unknown,
    schemable_unknown,
    schemable_unknown,
  );

  assertEquals(fullRoute.absolute_path, "/root/api/users.ts");
  assertEquals(fullRoute.parsed_path, parsed);
  assertEquals(fullRoute.route.method, "GET");
  assertEquals(fullRoute.route.pathname, "/api/users");
});

// ============================================================================
// from_partial_route tests
// ============================================================================

Deno.test("from_partial_route - converts PartialRoute to FullRoute", () => {
  const parsed = Path.parse("/root/api/hello.ts");
  const fileEntry = RouteBuilder.file_entry(parsed, "/api/hello", Option.none);
  const handler: Router.Handler = () => Router.text("Hello");
  const partialRoute = Tokens.partial_route("GET", handler);

  const fullRoute = RouteBuilder.from_partial_route(
    "ServerPlugin",
    fileEntry,
    partialRoute,
  );

  assertEquals(fullRoute.route.method, "GET");
  assertEquals(fullRoute.route.pathname, "/api/hello");
});

// ============================================================================
// wrap_handler tests
// ============================================================================

Deno.test("wrap_handler - applies middleware in order", async () => {
  const calls: string[] = [];

  const baseHandler: Router.Handler = () => {
    calls.push("handler");
    return Router.text("OK");
  };

  const middleware1: Router.Middleware<unknown> =
    (next) => async (req, params, ctx) => {
      calls.push("middleware1-before");
      const result = await next(req, params, ctx);
      calls.push("middleware1-after");
      return result;
    };

  const middleware2: Router.Middleware<unknown> =
    (next) => async (req, params, ctx) => {
      calls.push("middleware2-before");
      const result = await next(req, params, ctx);
      calls.push("middleware2-after");
      return result;
    };

  const wrapped = RouteBuilder.wrap_handler(baseHandler, [
    middleware1,
    middleware2,
  ]);

  const req = new Request("http://localhost/test");
  const params: Router.Params = {};
  const ctx = Router.context({});

  await wrapped(req, params, ctx);

  assertEquals(calls, [
    "middleware2-before",
    "middleware1-before",
    "handler",
    "middleware1-after",
    "middleware2-after",
  ]);
});

Deno.test("wrap_handler - returns original handler with empty middleware", () => {
  const handler: Router.Handler = () => Router.text("OK");
  const wrapped = RouteBuilder.wrap_handler(handler, []);

  assertEquals(wrapped, handler);
});

// ============================================================================
// wrap_partial_route tests
// ============================================================================

Deno.test("wrap_partial_route - wraps handler and preserves method", async () => {
  const handler: Router.Handler = () => Router.text("OK");
  const partialRoute = Tokens.partial_route("POST", handler);

  const mw: Router.Middleware<unknown> =
    (next) => async (req, params, ctx) => next(req, params, ctx);

  const wrapped = RouteBuilder.wrap_partial_route(partialRoute, [mw]);

  assertEquals(wrapped.method, "POST");
  assertEquals(wrapped.handler !== handler, true);
});

// ============================================================================
// builder tests
// ============================================================================

Deno.test("builder - returns Left when no plugins specified", async () => {
  const fs = createMockFilesystem();
  const config: RouteBuilder.BuildConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [],
  };

  const result = await RouteBuilder.build(config);
  assertEquals(Either.isLeft(result), true);
});

Deno.test("builder - processes files with plugin", async () => {
  const fs = createMockFilesystem({
    "/root/test.txt": mockFile("hello", "text/plain"),
  });

  const processedFiles: RouteBuilder.FileEntry[] = [];
  const testPlugin: RouteBuilder.Plugin = {
    name: "TestPlugin",
    process_file: (entry) => {
      processedFiles.push(entry);
      return Effect.right([]);
    },
    process_build: (_routes) => Effect.right([]),
  };

  const config: RouteBuilder.BuildConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [testPlugin],
  };

  await RouteBuilder.build(config);

  assertEquals(processedFiles.length, 1);
  assertEquals(processedFiles[0].relative_path, "/test.txt");
});

Deno.test("builder - aggregates routes from multiple plugins", async () => {
  const fs = createMockFilesystem({
    "/root/file.ts": mockFile("export const x = 1"),
  });

  const handler: Router.Handler = () => Router.text("OK");

  const plugin1: RouteBuilder.Plugin = {
    name: "Plugin1",
    process_file: (entry) =>
      Effect.right([
        RouteBuilder.full_route(
          "Plugin1",
          entry.parsed_path,
          Router.route("GET", "/route1", handler),
        ),
      ]),
    process_build: (_routes) => Effect.right([]),
  };

  const plugin2: RouteBuilder.Plugin = {
    name: "Plugin2",
    process_file: (entry) =>
      Effect.right([
        RouteBuilder.full_route(
          "Plugin2",
          entry.parsed_path,
          Router.route("POST", "/route2", handler),
        ),
      ]),
    process_build: (_routes) => Effect.right([]),
  };

  const config: RouteBuilder.BuildConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin1, plugin2],
  };

  const either = await RouteBuilder.build(config);
  assertEquals(Either.isRight(either), true);
  if (!Either.isRight(either)) return;

  assertEquals(either.right.site_routes.length, 2);
  const builderNames = either.right.site_routes.map((r) => r.builder);
  assertEquals(builderNames.filter((n) => n === "Plugin1").length, 1);
  assertEquals(builderNames.filter((n) => n === "Plugin2").length, 1);
});

Deno.test("builder - process_build receives all routes", async () => {
  const fs = createMockFilesystem({
    "/root/file.ts": mockFile("export const x = 1"),
  });

  const handler: Router.Handler = () => Router.text("OK");
  let receivedRoutes: RouteBuilder.SiteRoutes = [];

  const plugin: RouteBuilder.Plugin = {
    name: "TestPlugin",
    process_file: (entry) =>
      Effect.right([
        RouteBuilder.full_route(
          "TestPlugin",
          entry.parsed_path,
          Router.route("GET", "/test", handler),
        ),
      ]),
    process_build: (routes) => {
      receivedRoutes = routes;
      return Effect.right([]);
    },
  };

  const config: RouteBuilder.BuildConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  await RouteBuilder.build(config);

  assertEquals(receivedRoutes.length, 1);
  assertEquals(receivedRoutes[0].route.pathname, "/test");
});

Deno.test("builder - process_build can add additional routes", async () => {
  const fs = createMockFilesystem({
    "/root/file.ts": mockFile("export const x = 1"),
  });

  const handler: Router.Handler = () => Router.text("OK");

  const plugin: RouteBuilder.Plugin = {
    name: "TestPlugin",
    process_file: (entry) =>
      Effect.right([
        RouteBuilder.full_route(
          "TestPlugin",
          entry.parsed_path,
          Router.route("GET", "/original", handler),
        ),
      ]),
    process_build: (_routes) =>
      Effect.right([
        RouteBuilder.full_route(
          "TestPlugin",
          Path.parse("/generated"),
          Router.route("GET", "/generated", handler),
        ),
      ]),
  };

  const config: RouteBuilder.BuildConfig = {
    root_path: "/root",
    fs,
    unsafe_import,
    plugins: [plugin],
  };

  const either = await RouteBuilder.build(config);
  assertEquals(Either.isRight(either), true);
  if (!Either.isRight(either)) return;

  assertEquals(either.right.site_routes.length, 2);
  const pathnames = either.right.site_routes.map((r) => r.route.pathname);
  assertEquals(pathnames.includes("/original"), true);
  assertEquals(pathnames.includes("/generated"), true);
});

Deno.test(
  "builder - two builds on same config yield identical routes",
  async () => {
    const fs = createMockFilesystem({
      "/root/a.ts": mockFile("export const x = 1"),
      "/root/b.ts": mockFile("export const y = 2"),
    });

    const handler: Router.Handler = () => Router.text("OK");

    const plugin: RouteBuilder.Plugin = {
      name: "TestPlugin",
      process_file: (entry) =>
        Effect.right([
          RouteBuilder.full_route(
            "TestPlugin",
            entry.parsed_path,
            Router.route("GET", entry.relative_path, handler),
          ),
        ]),
      process_build: (_routes) => Effect.right([]),
    };

    const config: RouteBuilder.BuildConfig = {
      root_path: "/root",
      fs,
      unsafe_import,
      plugins: [plugin],
    };

    const either1 = await RouteBuilder.build(config);
    const either2 = await RouteBuilder.build(config);

    assertEquals(Either.isRight(either1), true);
    assertEquals(Either.isRight(either2), true);
    if (!Either.isRight(either1) || !Either.isRight(either2)) return;

    assertEquals(
      either1.right.site_routes.length,
      either2.right.site_routes.length,
    );
    assertEquals(either1.right.site_routes.length, 2);
  },
);

// ============================================================================
// Mock Filesystem tests
// ============================================================================

Deno.test("mockFilesystem - walk returns all files under root", async () => {
  const fs = createMockFilesystem({
    "/root/a.txt": mockFile("a"),
    "/root/sub/b.txt": mockFile("b"),
    "/other/c.txt": mockFile("c"),
  });

  const entries = await fs.walk("/root");

  assertEquals(entries.length, 2);
  const paths = entries.map((e) => e.absolute_path);
  assertEquals(paths.includes("/root/a.txt"), true);
  assertEquals(paths.includes("/root/sub/b.txt"), true);
});

Deno.test("mockFilesystem - read returns file content", async () => {
  const fs = createMockFilesystem({
    "/root/test.txt": mockFile("hello world"),
  });

  const stream = await fs.read(Path.parse("/root/test.txt"));
  const reader = stream.getReader();
  const { value } = await reader.read();
  const text = new TextDecoder().decode(value);

  assertEquals(text, "hello world");
});

Deno.test("mockFilesystem - write stores content", async () => {
  const fs = createMockFilesystem();

  const content = new TextEncoder().encode("new content");
  await fs.write(Path.parse("/new/file.txt"), content);

  const stream = await fs.read(Path.parse("/new/file.txt"));
  const reader = stream.getReader();
  const { value } = await reader.read();
  const text = new TextDecoder().decode(value);

  assertEquals(text, "new content");
});

Deno.test("mockFilesystem - makeTempFile creates unique paths", async () => {
  const fs = createMockFilesystem();

  const path1 = await fs.makeTempFile({ suffix: ".ts" });
  const path2 = await fs.makeTempFile({ suffix: ".ts" });

  assertEquals(path1 !== path2, true);
  assertEquals(path1.endsWith(".ts"), true);
  assertEquals(path2.endsWith(".ts"), true);
});
