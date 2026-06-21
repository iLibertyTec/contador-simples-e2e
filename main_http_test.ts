import { assertEquals } from "@std/assert";

import { handler } from "./main.ts";

deno.test("GET /health retorna contrato exato", async (): Promise<void> => {
  const request = new Request("http://localhost/health");

  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    ok: true,
    service: "contador",
  });
});
