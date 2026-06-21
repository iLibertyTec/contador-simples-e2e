import { assertEquals, assertMatch } from "@std/assert";

import { handler } from "./main.ts";

Deno.test("GET /health retorna contrato exato", async (): Promise<void> => {
  const request = new Request("http://localhost/health", {
    method: "GET",
  });

  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.text(), '{"ok":true,"service":"contador"}');
});

Deno.test("POST /health retorna comportamento esperado do projeto", async (): Promise<void> => {
  const request = new Request("http://localhost/health", {
    method: "POST",
  });

  const response = await handler(request);

  assertEquals(response.status, 404);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.text(), '{"error":"not found"}');
});

Deno.test("GET / retorna HTML estático básico", async (): Promise<void> => {
  const request = new Request("http://localhost/", {
    method: "GET",
  });

  const response = await handler(request);
  const body = await response.text();

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assertMatch(body, /<!DOCTYPE html>|<html[\s>]/i);
});
