import { assertEquals } from "@std/assert";
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
