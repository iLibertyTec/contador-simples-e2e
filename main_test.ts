import { assertEquals, assertMatch } from "@std/assert";

import { VisitCounter } from "./counter.ts";
import { createHandler } from "./main.ts";

Deno.test("GET /health retorna contrato esperado", async (): Promise<void> => {
  const handler = createHandler(new VisitCounter());
  const request = new Request("http://localhost/health", { method: "GET" });

  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    ok: true,
    service: "contador",
  });
});

Deno.test("GET / retorna HTML com contador inicial atualizado", async (): Promise<void> => {
  const counter = new VisitCounter();
  const handler = createHandler(counter);
  const request = new Request("http://localhost/", { method: "GET" });

  const response = await handler(request);
  const html = await response.text();

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assertMatch(html, /<h1>Visit Analytics<\/h1>/);
  assertMatch(html, /Evolved by the iFactory autonomous team\./);
  assertMatch(html, /<div id="count">1<\/div>/);
});

Deno.test("GET / incrementa contador entre chamadas consecutivas no mesmo handler", async (): Promise<void> => {
  const counter = new VisitCounter();
  const handler = createHandler(counter);

  const firstResponse = await handler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const firstHtml = await firstResponse.text();

  const secondResponse = await handler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const secondHtml = await secondResponse.text();

  assertEquals(firstResponse.status, 200);
  assertEquals(secondResponse.status, 200);
  assertMatch(firstHtml, /<div id="count">1<\/div>/);
  assertMatch(secondHtml, /<div id="count">2<\/div>/);
});
