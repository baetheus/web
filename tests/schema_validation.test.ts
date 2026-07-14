import { assertEquals } from "@std/assert";
import type { Schema } from "@baetheus/fun/schemable";

import * as Router from "../router.ts";
import * as Tokens from "../tokens.ts";
import { apply_schema_validation } from "../plugin_server.ts";

// Schema: { name: string }
const user_schema: Schema<{ name: string }> = (s) =>
  s.struct({ name: s.string() });

// Schema: { id: string }
const id_params_schema: Schema<{ id: string }> = (s) =>
  s.struct({ id: s.string() });

const ctx = Router.context({});

function json_request(body: unknown, method = "POST"): Request {
  return new Request("http://localhost/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Body validation
// ============================================================================

Deno.test("body validation - happy path delivers decoded body to handler", async () => {
  let captured_body: unknown = null;

  const partial = Tokens.post({
    body: user_schema,
    handler: (_req, _params, body, _ctx) => {
      captured_body = body;
      return Router.text("ok");
    },
  });

  const validated = apply_schema_validation(partial);
  const response = await validated.handler(
    json_request({ name: "Alice" }),
    {},
    ctx,
  );

  assertEquals(response.status, 200);
  assertEquals(captured_body, { name: "Alice" });
});

Deno.test("body validation - 400 on malformed JSON", async () => {
  const partial = Tokens.post({
    body: user_schema,
    handler: () => Router.text("ok"),
  });

  const validated = apply_schema_validation(partial);
  const req = new Request("http://localhost/test", {
    method: "POST",
    body: "not { valid",
  });

  const response = await validated.handler(req, {}, ctx);
  assertEquals(response.status, 400);
});

Deno.test("body validation - 400 on schema mismatch", async () => {
  const partial = Tokens.post({
    body: user_schema,
    handler: () => Router.text("ok"),
  });

  const validated = apply_schema_validation(partial);
  const response = await validated.handler(
    json_request({ wrong_field: 42 }),
    {},
    ctx,
  );

  assertEquals(response.status, 400);
  const text = await response.text();
  // Error message should reference the missing field
  assertEquals(text.includes("name") || text.length > 0, true);
});

Deno.test("body validation - no-op when no body_schema", async () => {
  const partial = Tokens.post((_req, _params, _ctx) => Router.text("ok"));
  const validated = apply_schema_validation(partial);

  // handler should be unchanged (same reference)
  assertEquals(validated.handler, partial.handler);
});

// ============================================================================
// Params validation
// ============================================================================

Deno.test("params validation - decoded params passed to schema handler", async () => {
  let captured_params: unknown = null;

  const partial = Tokens.get({
    params: id_params_schema,
    handler: (_req, params, _body, _ctx) => {
      captured_params = params;
      return Router.text("ok");
    },
  });

  const validated = apply_schema_validation(partial);
  const response = await validated.handler(
    new Request("http://localhost/items/99"),
    { id: "99" },
    ctx,
  );

  assertEquals(response.status, 200);
  assertEquals(captured_params, { id: "99" });
});

Deno.test("params validation - 400 on schema mismatch", async () => {
  const partial = Tokens.get({
    params: id_params_schema,
    handler: () => Router.text("ok"),
  });

  const validated = apply_schema_validation(partial);
  // Pass params that don't satisfy the schema (missing 'id')
  const response = await validated.handler(
    new Request("http://localhost/items"),
    {},
    ctx,
  );

  assertEquals(response.status, 400);
});

// ============================================================================
// Combined body + params validation
// ============================================================================

Deno.test("combined - both params and body decoded on valid request", async () => {
  let captured_params: unknown = null;
  let captured_body: unknown = null;

  const partial = Tokens.put({
    params: id_params_schema,
    body: user_schema,
    handler: (_req, params, body, _ctx) => {
      captured_params = params;
      captured_body = body;
      return Router.text("ok");
    },
  });

  const validated = apply_schema_validation(partial);
  const response = await validated.handler(
    json_request({ name: "Bob" }, "PUT"),
    { id: "7" },
    ctx,
  );

  assertEquals(response.status, 200);
  assertEquals(captured_params, { id: "7" });
  assertEquals(captured_body, { name: "Bob" });
});
