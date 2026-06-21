import {
  assertEquals,
  assertStringIncludes,
} from "@std/assert";

async function loadHandler(): Promise<(req: Request) => Promise<Response>> {
  const module = await import(`./main.ts?test=${crypto.randomUUID()}`);
  return module.handler as (req: Request) => Promise<Response>;
}

deno.test("cada import do handler inicia com estado limpo", async (): Promise<void> => {
  const handlerA = await loadHandler();
  const responseA = await handlerA(
    new Request("http://localhost/api/visits"),
  );

  assertEquals(responseA.status, 200);
  assertStringIncludes(
    responseA.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await responseA.json(), {
    visits: 0,
    uniqueVisitors: 0,
    lastVisitor: null,
  });

  const handlerB = await loadHandler();
  const responseB = await handlerB(
    new Request("http://localhost/api/visits"),
  );

  assertEquals(responseB.status, 200);
  assertStringIncludes(
    responseB.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await responseB.json(), {
    visits: 0,
    uniqueVisitors: 0,
    lastVisitor: null,
  });
});

deno.test("GET /health retorna contrato esperado", async (): Promise<void> => {
  const handler = await loadHandler();
  const response = await handler(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

deno.test("GET / retorna HTML da página inicial", async (): Promise<void> => {
  const handler = await loadHandler();
  const response = await handler(new Request("http://localhost/"));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "text/html",
  );
  assertStringIncludes(body, "<!DOCTYPE html>");
  assertStringIncludes(body, "Visit Analytics");
  assertStringIncludes(body, 'id="count">0</div>');
  assertStringIncludes(body, "Registrar visita");
});

deno.test("GET /api/visits retorna contador inicial", async (): Promise<void> => {
  const handler = await loadHandler();
  const response = await handler(new Request("http://localhost/api/visits"));

  assertEquals(response.status, 200);
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await response.json(), {
    visits: 0,
    uniqueVisitors: 0,
    lastVisitor: null,
  });
});

deno.test("POST /api/visits incrementa contador e retorna mensagem", async (): Promise<void> => {
  const handler = await loadHandler();
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
  assertStringIncludes(
    response.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
    message: "Total visits: 1 · Unique visitors: 1 · Last visitor: browser",
  });
});

deno.test("POST /api/visits sem body JSON válido mantém compatibilidade mínima", async (): Promise<void> => {
  const handler = await loadHandler();

  const invalidJsonResponse = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{",
    }),
  );

  assertEquals(invalidJsonResponse.status, 200);
  assertStringIncludes(
    invalidJsonResponse.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await invalidJsonResponse.json(), {
    visits: 1,
    uniqueVisitors: 0,
    lastVisitor: null,
    message: "Total visits: 1 · Unique visitors: 0",
  });

  const noContentTypeResponse = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      body: JSON.stringify({ visitorId: "ignored-without-content-type" }),
    }),
  );

  assertEquals(noContentTypeResponse.status, 200);
  assertStringIncludes(
    noContentTypeResponse.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await noContentTypeResponse.json(), {
    visits: 2,
    uniqueVisitors: 0,
    lastVisitor: null,
    message: "Total visits: 2 · Unique visitors: 0",
  });

  const emptyBodyResponse = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    }),
  );

  assertEquals(emptyBodyResponse.status, 200);
  assertStringIncludes(
    emptyBodyResponse.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await emptyBodyResponse.json(), {
    visits: 3,
    uniqueVisitors: 0,
    lastVisitor: null,
    message: "Total visits: 3 · Unique visitors: 0",
  });
});

deno.test("rotas e verbos inválidos retornam 404 com JSON", async (): Promise<void> => {
  const handler = await loadHandler();

  const missingRouteResponse = await handler(
    new Request("http://localhost/unknown"),
  );
  assertEquals(missingRouteResponse.status, 404);
  assertStringIncludes(
    missingRouteResponse.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await missingRouteResponse.json(), { error: "not found" });

  const invalidMethodOnHealthResponse = await handler(
    new Request("http://localhost/health", {
      method: "POST",
    }),
  );
  assertEquals(invalidMethodOnHealthResponse.status, 200);
  assertStringIncludes(
    invalidMethodOnHealthResponse.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await invalidMethodOnHealthResponse.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });

  const invalidMethodOnVisitsResponse = await handler(
    new Request("http://localhost/api/visits", {
      method: "DELETE",
    }),
  );
  assertEquals(invalidMethodOnVisitsResponse.status, 404);
  assertStringIncludes(
    invalidMethodOnVisitsResponse.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await invalidMethodOnVisitsResponse.json(), {
    error: "not found",
  });
});

deno.test("múltiplos imports isolam estado mesmo com chamadas paralelas", async (): Promise<void> => {
  const handlers = await Promise.all([
    loadHandler(),
    loadHandler(),
    loadHandler(),
  ]);

  const responses = await Promise.all(
    handlers.map((handler, index: number) =>
      handler(
        new Request("http://localhost/api/visits", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ visitorId: `visitor-${index}` }),
        }),
      )
    ),
  );

  const payloads = await Promise.all(
    responses.map((response: Response) => response.json()),
  );

  assertEquals(payloads, [
    {
      visits: 1,
      uniqueVisitors: 1,
      lastVisitor: "visitor-0",
      message: "Total visits: 1 · Unique visitors: 1 · Last visitor: visitor-0",
    },
    {
      visits: 1,
      uniqueVisitors: 1,
      lastVisitor: "visitor-1",
      message: "Total visits: 1 · Unique visitors: 1 · Last visitor: visitor-1",
    },
    {
      visits: 1,
      uniqueVisitors: 1,
      lastVisitor: "visitor-2",
      message: "Total visits: 1 · Unique visitors: 1 · Last visitor: visitor-2",
    },
  ]);
});
