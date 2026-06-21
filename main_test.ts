import { assertEquals } from "@std/assert";

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
