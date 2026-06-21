import { assert, assertEquals } from "@std/assert";
import { handler } from "./main.ts";

Deno.test("GET /health retorna contrato exato do contador", async () => {
  const req = new Request("http://localhost/health");

  const res = await handler(req);

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(await res.json(), {
    ok: true,
    service: "contador",
  });
});

Deno.test("GET / retorna HTML mínimo com status e content-type corretos", async () => {
  const req = new Request("http://localhost/");

  const res = await handler(req);
  const body = await res.text();

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/html; charset=utf-8");
  assert(body.includes("<!DOCTYPE html>") || body.includes("<html"));
});

Deno.test("GET /api/visits retorna 404 controlado em JSON", async () => {
  const req = new Request("http://localhost/api/visits");

  const res = await handler(req);

  assertEquals(res.status, 404);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(await res.json(), { error: "not found" });
});

Deno.test("POST /api/visits retorna 404 controlado em JSON", async () => {
  const req = new Request("http://localhost/api/visits", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ visitorId: "abc" }),
  });

  const res = await handler(req);

  assertEquals(res.status, 404);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(await res.json(), { error: "not found" });
});

Deno.test("GET /nao-existe retorna 404 controlado em JSON", async () => {
  const req = new Request("http://localhost/nao-existe");

  const res = await handler(req);

  assertEquals(res.status, 404);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(await res.json(), { error: "not found" });
});
