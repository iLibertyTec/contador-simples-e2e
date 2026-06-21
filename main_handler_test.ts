import {
  assertEquals,
  assertStringIncludes,
} from "@std/assert";
import {
  getTestVisitsService,
  resetVisitsStateForTest,
} from "./visits_state_test_helpers.ts";

type AppHandler = (req: Request) => Promise<Response>;

type HealthRouteModule = {
  GET: (req: Request) => Response;
};

type VisitsRouteModule = {
  GET: (req: Request) => Response;
  POST: (req: Request) => Promise<Response>;
};

async function loadHandler(): Promise<AppHandler> {
  const module = await import(`./main.ts?test=${crypto.randomUUID()}`);
  return module.createHandler(getTestVisitsService()) as AppHandler;
}

async function loadHealthRoute(): Promise<HealthRouteModule> {
  return await import(
    `./routes/health.ts?test=${crypto.randomUUID()}`,
  ) as HealthRouteModule;
}

async function loadVisitsRoute(): Promise<VisitsRouteModule> {
  return await import(
    `./routes/api/visits.ts?test=${crypto.randomUUID()}`,
  ) as VisitsRouteModule;
}

deno.test("mesmo handler compartilha estado entre requisições", async (): Promise<void> => {
  resetVisitsStateForTest();
  const handler = await loadHandler();

  const firstResponse = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ visitorId: "browser" }),
    }),
  );

  assertEquals(firstResponse.status, 200);
  assertEquals(await firstResponse.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
    message: "Total visits: 1 · Unique visitors: 1 · Last visitor: browser",
  });

  const secondResponse = await handler(
    new Request("http://localhost/api/visits"),
  );

  assertEquals(secondResponse.status, 200);
  assertEquals(await secondResponse.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
  });
});

deno.test("novo import do handler compartilha estado do módulo singleton", async (): Promise<void> => {
  resetVisitsStateForTest();
  const handlerA = await loadHandler();

  await handlerA(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ visitorId: "browser" }),
    }),
  );

  const responseA = await handlerA(
    new Request("http://localhost/api/visits"),
  );

  assertEquals(responseA.status, 200);
  assertStringIncludes(
    responseA.headers.get("content-type") ?? "",
    "application/json",
  );
  assertEquals(await responseA.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
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
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
  });
});

deno.test("GET /health retorna contrato HTTP atual", async (): Promise<void> => {
  resetVisitsStateForTest();
  const handler = await loadHandler();
  const response = await handler(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

deno.test("POST /health mantém contrato atual e retorna health", async (): Promise<void> => {
  resetVisitsStateForTest();
  const handler = await loadHandler();
  const response = await handler(
    new Request("http://localhost/health", {
      method: "POST",
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

deno.test("GET / retorna HTML da página inicial", async (): Promise<void> => {
  resetVisitsStateForTest();
  const handler = await loadHandler();
  const response = await handler(new Request("http://localhost/"));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assertStringIncludes(body, "<!DOCTYPE html>");
  assertStringIncludes(body, "Visit Analytics");
  assertStringIncludes(body, 'id="count">0</div>');
  assertStringIncludes(body, "Registrar visita");
});

deno.test("GET /api/visits retorna contador inicial", async (): Promise<void> => {
  resetVisitsStateForTest();
  const handler = await loadHandler();
  const response = await handler(new Request("http://localhost/api/visits"));

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    visits: 0,
    uniqueVisitors: 0,
    lastVisitor: null,
  });
});

deno.test("POST /api/visits incrementa contador e retorna mensagem", async (): Promise<void> => {
  resetVisitsStateForTest();
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
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
    message: "Total visits: 1 · Unique visitors: 1 · Last visitor: browser",
  });
});

deno.test("GET da rota Fresh /health retorna contrato esperado", async (): Promise<void> => {
  const route = await loadHealthRoute();
  const response = route.GET(new Request("http://localhost/health"));

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
});

deno.test("GET da rota Fresh /api/visits retorna estado atual", async (): Promise<void> => {
  resetVisitsStateForTest();
  const route = await loadVisitsRoute();
  const response = route.GET(new Request("http://localhost/api/visits"));

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    visits: 0,
    uniqueVisitors: 0,
    lastVisitor: null,
  });
});

deno.test("POST da rota Fresh /api/visits aceita visitorId opcional", async (): Promise<void> => {
  resetVisitsStateForTest();
  const route = await loadVisitsRoute();
  const response = await route.POST(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ visitorId: "browser" }),
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
    message: "Total visits: 1 · Unique visitors: 1 · Last visitor: browser",
  });
});

deno.test("POST da rota Fresh /api/visits aceita body vazio sem content-type", async (): Promise<void> => {
  resetVisitsStateForTest();
  const route = await loadVisitsRoute();
  const response = await route.POST(
    new Request("http://localhost/api/visits", {
      method: "POST",
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 0,
    lastVisitor: null,
    message: "Total visits: 1 · Unique visitors: 0",
  });
});

deno.test("POST da rota Fresh /api/visits rejeita JSON inválido", async (): Promise<void> => {
  resetVisitsStateForTest();
  const route = await loadVisitsRoute();
  const response = await route.POST(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{",
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(await response.json(), {
    error: "invalid json body",
  });
});

deno.test("POST da rota Fresh /api/visits rejeita chaves desconhecidas", async (): Promise<void> => {
  resetVisitsStateForTest();
  const route = await loadVisitsRoute();
  const response = await route.POST(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ foo: "bar" }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(await response.json(), {
    error: "invalid json body",
  });
});

deno.test("POST da rota Fresh /api/visits rejeita body com conteúdo sem content-type JSON", async (): Promise<void> => {
  resetVisitsStateForTest();
  const route = await loadVisitsRoute();
  const response = await route.POST(
    new Request("http://localhost/api/visits", {
      method: "POST",
      body: JSON.stringify({ visitorId: "browser" }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(await response.json(), {
    error: "unsupported media type",
  });
});

deno.test("POST da rota Fresh /api/visits aceita media type +json", async (): Promise<void> => {
  resetVisitsStateForTest();
  const route = await loadVisitsRoute();
  const response = await route.POST(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/ld+json",
      },
      body: JSON.stringify({ visitorId: "browser" }),
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 1,
    lastVisitor: "browser",
    message: "Total visits: 1 · Unique visitors: 1 · Last visitor: browser",
  });
});
