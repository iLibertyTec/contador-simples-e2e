import {
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
  assertStringNotIncludes,
} from "@std/assert";
import { handler } from "./main.ts";

Deno.test("GET /health retorna contrato JSON esperado", async (): Promise<void> => {
  const response: Response = await handler(
    new Request("http://localhost/health"),
  );

  assertEquals(response.status, 200);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );

  const body: unknown = await response.json();

  assertEquals(body, {
    ok: true,
    service: "contador",
  });
  assertNotEquals(body, {
    ok: true,
    service: "contador",
    version: "0.1.0",
  });
});

Deno.test("GET / retorna HTML estático mínimo", async (): Promise<void> => {
  const response: Response = await handler(new Request("http://localhost/"));

  assertEquals(response.status, 200);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "text/html",
  );
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "charset=utf-8",
  );

  const body: string = await response.text();

  assertStringIncludes(body, "<!DOCTYPE html>");
  assertStringIncludes(body, "<html");
  assertStringNotIncludes(body, "/api/visits");
  assertStringNotIncludes(body, "fetch(");
});

Deno.test("GET /api/visits retorna 404 de forma controlada", async (): Promise<void> => {
  const response: Response = await handler(
    new Request("http://localhost/api/visits"),
  );

  assertEquals(response.status, 404);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );

  const body: unknown = await response.json();

  assertEquals(body, { error: "not found" });
});

Deno.test("POST /api/visits retorna 404 de forma controlada", async (): Promise<void> => {
  const response: Response = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
    }),
  );

  assertEquals(response.status, 404);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );

  const body: unknown = await response.json();

  assertEquals(body, { error: "not found" });
});

Deno.test("GET /rota-inexistente retorna 404 controlado e previsível", async (): Promise<void> => {
  const response: Response = await handler(
    new Request("http://localhost/rota-inexistente"),
  );

  assertEquals(response.status, 404);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );

  const body: unknown = await response.json();

  assertEquals(body, { error: "not found" });
});

Deno.test("POST /rota-inexistente retorna 404 controlado e previsível", async (): Promise<void> => {
  const response: Response = await handler(
    new Request("http://localhost/rota-inexistente", {
      method: "POST",
    }),
  );

  assertEquals(response.status, 404);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );

  const body: unknown = await response.json();

  assertEquals(body, { error: "not found" });
});
