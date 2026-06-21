import { assertEquals } from "@std/assert";

import { handler } from "./main.ts";

deno.test("GET /health retorna contrato exato", async (): Promise<void> => {
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

deno.test("handler exposto atende GET /health como contrato HTTP", async (): Promise<void> => {
  const server = Deno.serve({ port: 0 }, handler);

  try {
    const response = await fetch(`${server.addr.url}/health`);

    assertEquals(response.status, 200);
    assertEquals(
      response.headers.get("content-type"),
      "application/json; charset=utf-8",
    );
    assertEquals(await response.text(), '{"ok":true,"service":"contador"}');
  } finally {
    await server.shutdown();
  }
});
