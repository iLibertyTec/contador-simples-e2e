import {
  assertEquals,
  assertStringIncludes,
} from "@std/assert";
import { resetVisitsState } from "./visits_state.ts";

type AppHandler = (req: Request) => Promise<Response>;

async function loadHandler(): Promise<AppHandler> {
  const module = await import(`./main.ts?test=${crypto.randomUUID()}`);
  return module.handler as AppHandler;
}

deno.test("mesmo handler compartilha estado entre requisições", async (): Promise<void> => {
  resetVisitsState();
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
  resetVisitsState();
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
  resetVisitsState();
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
  resetVisitsState();
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
  resetVisitsState();
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
  resetVisitsState();
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
  resetVisitsState();
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

deno.test("POST /api/visits com body vazio e content-type JSON mantém contrato atual", async (): Promise<void> => {
  resetVisitsState();
  const handler = await loadHandler();
  const response = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 0,
    lastVisitor: null,
    message: "Total visits: 1 · Unique visitors: 0",
  });
});

deno.test("POST /api/visits com JSON malformado mantém contrato atual", async (): Promise<void> => {
  resetVisitsState();
  const handler = await loadHandler();
  const response = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{",
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    visits: 1,
    uniqueVisitors: 0,
    lastVisitor: null,
    message: "Total visits: 1 · Unique visitors: 0",
  });
});

deno.test("POST /api/visits sem content-type JSON mantém contrato atual", async (): Promise<void> => {
  resetVisitsState();
  const handler = await loadHandler();
  const response = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
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
    uniqueVisitors: 0,
    lastVisitor: null,
    message: "Total visits: 1 · Unique visitors: 0",
  });
});

deno.test("rota inválida retorna 404 em JSON", async (): Promise<void> => {
  resetVisitsState();
  const handler = await loadHandler();
  const response = await handler(new Request("http://localhost/does-not-exist"));

  assertEquals(response.status, 404);
  assertEquals(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assertEquals(await response.json(), {
    error: "not found",
  });
});
