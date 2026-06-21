import {
  assertEquals,
  assertStringIncludes,
} from "@std/assert";
import { handler } from "./main.ts";

deno.test("GET /health retorna contrato esperado", async (): Promise<void> => {
  const response = await handler(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

deno.test("GET / retorna HTML da página inicial", async (): Promise<void> => {
  const response = await handler(new Request("http://localhost/"));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "text/html; charset=utf-8");
  assertStringIncludes(body, "<!DOCTYPE html>");
  assertStringIncludes(body, "Visit Analytics");
  assertStringIncludes(body, 'id="count">0</div>');
  assertStringIncludes(body, "Registrar visita");
});

deno.test("GET /api/visits retorna contador inicial", async (): Promise<void> => {
  const response = await handler(new Request("http://localhost/api/visits"));

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), {
    visits: 0,
    uniqueVisitors: 0,
    lastVisitor: null,
  });
});

deno.test("POST /api/visits incrementa contador e retorna mensagem", async (): Promise<void> => {
  const response = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ visitorId: "browser" }),
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
    message: "Total visits: 1 · Unique visitors: 1 · Last visitor: browser",
  });
});
