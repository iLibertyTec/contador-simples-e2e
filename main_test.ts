import {
  assertEquals,
  assertNotStrictEquals,
} from "@std/assert";
import { VisitCounter } from "./counter.ts";
import { createHandler, handler } from "./main.ts";

Deno.test("createHandler cria handlers isolados por instância", async () => {
  const handlerA = createHandler(new VisitCounter());
  const handlerB = createHandler(new VisitCounter());

  assertNotStrictEquals(handlerA, handlerB);

  await handlerA(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: "alice" }),
    }),
  );

  const responseA = await handlerA(
    new Request("http://localhost/api/visits", { method: "GET" }),
  );
  const responseB = await handlerB(
    new Request("http://localhost/api/visits", { method: "GET" }),
  );

  assertEquals(await responseA.json(), {
    visits: 1,
    lastVisitor: "alice",
  });
  assertEquals(await responseB.json(), {
    visits: 0,
    lastVisitor: null,
  });
});

Deno.test("handler padrão preserva comportamento de /health", async () => {
  const response = await handler(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

Deno.test("handler retorna 404 para rota desconhecida", async () => {
  const localHandler = createHandler(new VisitCounter());
  const response = await localHandler(new Request("http://localhost/unknown"));

  assertEquals(response.status, 404);
  assertEquals(await response.json(), { error: "not found" });
});
