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

// ============================================================================
// file_entry tests
// ============================================================================

Deno.test("file_entry - creates FileEntry with leading slash", () => {
  const parsed = Path.parse("/root/dir/file.ts");
  const entry = RouteBuilder.file_entry(parsed, "dir/file.ts", Option.none);

  assertEquals(entry.relative_path, "/dir/file.ts");
  assertEquals(entry.absolute_path, "/root/dir/file.ts");
  assertEquals(entry.parsed_path, parsed);
  assertEquals(entry.mime_type, Option.none);
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
  const schemable_unknown = Schemable.schema((s) => s.unknown());
  const r = Router.right("GET /api/users", () => Router.text("OK"));

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
  const handler: Router.Handler = Effect.gets(() => Router.text("Hello"));
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

  const baseHandler: Router.Handler = Effect.gets(() => {
    calls.push("handler");
    return Router.text("OK");
  });

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
  const params = {} as URLPatternResult;
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
  const handler: Router.Handler = Effect.gets(() => Router.text("OK"));
  const wrapped = RouteBuilder.wrap_handler(handler, []);

  assertEquals(wrapped, handler);
});
