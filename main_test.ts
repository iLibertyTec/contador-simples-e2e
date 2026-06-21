import {
  assertEquals,
  assertMatch,
  assertNotMatch,
  assertNotStrictEquals,
} from "@std/assert";
import { VisitCounter } from "./counter.ts";
import { createHandler, handler } from "./main.ts";

Deno.test("createHandler cria handlers isolados por instância", async () => {
  const handlerA = createHandler(new VisitCounter());
  const handlerB = createHandler(new VisitCounter());

  assertNotStrictEquals(handlerA, handlerB);

  const deprecatedPostResponse = await handlerA(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: "alice" }),
    }),
  );

  assertEquals(deprecatedPostResponse.status, 410);
  assertEquals(await deprecatedPostResponse.json(), {
    error: "deprecated",
    message:
      "POST /api/visits foi descontinuado. Use GET / para registrar visitas.",
  });

  const responseA = await handlerA(
    new Request("http://localhost/api/visits", { method: "GET" }),
  );
  const responseB = await handlerB(
    new Request("http://localhost/api/visits", { method: "GET" }),
  );

  assertEquals(await responseA.json(), {
    visits: 0,
    lastVisitor: null,
    deprecated: true,
    message: "Use GET / para registrar e visualizar visitas server-side.",
  });
  assertEquals(await responseB.json(), {
    visits: 0,
    lastVisitor: null,
    deprecated: true,
    message: "Use GET / para registrar e visualizar visitas server-side.",
  });
});

Deno.test("GET / incrementa contador e renderiza valor inicial no HTML", async () => {
  const localHandler = createHandler(new VisitCounter());

  const response = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );

  const html = await response.text();
  assertMatch(html, /<div id="count">1<\/div>/);

  const visitsResponse = await localHandler(
    new Request("http://localhost/api/visits", { method: "GET" }),
  );

  assertEquals(await visitsResponse.json(), {
    visits: 1,
    lastVisitor: null,
    deprecated: true,
    message: "Use GET / para registrar e visualizar visitas server-side.",
  });
});

Deno.test("GET / renderiza contador server-side sem script ou botão de incremento", async () => {
  const localHandler = createHandler(new VisitCounter());

  const response = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );

  const html = await response.text();

  assertMatch(html, /<div id="count">1<\/div>/);
  assertMatch(html, /<p id="msg">.+<\/p>/);
  assertNotMatch(html, /<button/i);
  assertNotMatch(html, /<script/i);
  assertNotMatch(html, /\/api\/visits/);
  assertNotMatch(html, /Estado atual:/);
});

Deno.test("GET / consecutivos exibem 1 e 2 no HTML", async () => {
  const localHandler = createHandler(new VisitCounter());

  const response1 = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const response2 = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );

  const html1 = await response1.text();
  const html2 = await response2.text();

  assertMatch(html1, /<div id="count">1<\/div>/);
  assertMatch(html2, /<div id="count">2<\/div>/);
});

Deno.test("GET / mantém mensagem legível e consistente em recargas subsequentes", async () => {
  const localHandler = createHandler(new VisitCounter());

  const response1 = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const response2 = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );

  const html1 = await response1.text();
  const html2 = await response2.text();

  assertMatch(html1, /<div id="count">1<\/div>/);
  assertMatch(html2, /<div id="count">2<\/div>/);
  assertMatch(html1, /<p id="msg">.+<\/p>/);
  assertMatch(html2, /<p id="msg">.+<\/p>/);
  assertNotMatch(html1, /<p id="msg"><\/p>/);
  assertNotMatch(html2, /<p id="msg"><\/p>/);
  assertNotMatch(html1, /undefined/);
  assertNotMatch(html2, /undefined/);
  assertMatch(html2, /Total de visitas: 2\. Última visita: anônima\./);
});

Deno.test("GET / renderiza mensagem visível de contador com fallback", async () => {
  const localHandler = createHandler(new VisitCounter());

  const response = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );

  const html = await response.text();

  assertMatch(html, /<p id="msg">.+<\/p>/);
  assertMatch(html, /Total de visitas: 1\. Última visita: anônima\./);
  assertNotMatch(html, /<p id="msg"><\/p>/);
  assertNotMatch(html, /<p id="msg">undefined<\/p>/);
});

Deno.test("GET /health não incrementa contador antes da primeira visita", async () => {
  const localHandler = createHandler(new VisitCounter());

  const healthResponse = await localHandler(
    new Request("http://localhost/health", { method: "GET" }),
  );

  assertEquals(healthResponse.status, 200);
  assertEquals(await healthResponse.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });

  const pageResponse = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );

  const html = await pageResponse.text();
  assertMatch(html, /<div id="count">1<\/div>/);
});

Deno.test("GET /health não incrementa contador entre visitas reais", async () => {
  const localHandler = createHandler(new VisitCounter());

  const response1 = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const healthResponse = await localHandler(
    new Request("http://localhost/health", { method: "GET" }),
  );
  const response2 = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );

  const html1 = await response1.text();
  const html2 = await response2.text();

  assertEquals(healthResponse.status, 200);
  assertEquals(await healthResponse.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
  assertMatch(html1, /<div id="count">1<\/div>/);
  assertMatch(html2, /<div id="count">2<\/div>/);
});

Deno.test("GET /api/visits expõe estado sem incrementar e marca depreciação", async () => {
  const localHandler = createHandler(new VisitCounter());

  const pageResponse = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const html = await pageResponse.text();
  assertMatch(html, /<div id="count">1<\/div>/);

  const apiResponse = await localHandler(
    new Request("http://localhost/api/visits", { method: "GET" }),
  );

  assertEquals(apiResponse.status, 200);
  assertEquals(await apiResponse.json(), {
    visits: 1,
    lastVisitor: null,
    deprecated: true,
    message: "Use GET / para registrar e visualizar visitas server-side.",
  });

  const nextPageResponse = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const nextHtml = await nextPageResponse.text();
  assertMatch(nextHtml, /<div id="count">2<\/div>/);
});

Deno.test("POST /api/visits retorna 410 e não incrementa contador", async () => {
  const localHandler = createHandler(new VisitCounter());

  const postResponse = await localHandler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: "alice" }),
    }),
  );

  assertEquals(postResponse.status, 410);
  assertEquals(await postResponse.json(), {
    error: "deprecated",
    message:
      "POST /api/visits foi descontinuado. Use GET / para registrar visitas.",
  });

  const pageResponse = await localHandler(
    new Request("http://localhost/", { method: "GET" }),
  );
  const html = await pageResponse.text();

  assertMatch(html, /<div id="count">1<\/div>/);
  assertMatch(html, /Total de visitas: 1\. Última visita: anônima\./);
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

  const response = await localHandler(
    new Request("http://localhost/unknown", { method: "GET" }),
  );

  assertEquals(response.status, 404);
  assertEquals(await response.json(), { error: "not found" });
});
