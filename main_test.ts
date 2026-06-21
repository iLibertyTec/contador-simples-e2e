import {
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "@std/assert";
import { handler } from "./main.ts";

Deno.test("GET /health retorna contrato JSON esperado", async () => {
  const response = await handler(new Request("http://localhost/health"));

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
