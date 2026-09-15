import { test } from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "test_secret";

const { handler } = await import("../src/index.mjs");

function eventWith(body) {
  return {
    body: typeof body === "string" ? body : JSON.stringify(body),
    requestContext: { requestId: "req-test" }
  };
}

test("rejects a malformed JSON body", async () => {
  const response = await handler(eventWith("{not json"));

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).error.code, "invalid_request");
});

test("rejects a CPF that fails check-digit validation", async () => {
  const response = await handler(eventWith({ cpf: "11144477734" }));

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).error.code, "invalid_cpf");
});

test("rejects a missing CPF", async () => {
  const response = await handler(eventWith({}));

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).error.code, "invalid_cpf");
});

test("echoes the request id back in the response headers", async () => {
  const response = await handler(eventWith({ cpf: "000" }));

  assert.equal(response.headers["x-request-id"], "req-test");
});
