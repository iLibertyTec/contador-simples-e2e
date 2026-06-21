import { assertEquals, assertStringIncludes } from "@std/assert";

import { VisitCounter } from "./counter.ts";
import { createHandler } from "./main.ts";

test("createHandler uses isolated counter state for visits route", async () => {
  const handler = createHandler(new VisitCounter());

  const initialResponse = await handler(
    new Request("http://localhost/api/visits"),
  );
  assertEquals(initialResponse.status, 200);
  assertEquals(await initialResponse.json(), {
    visits: 0,
    lastVisitor: null,
  });

  const recordResponse = await handler(
    new Request("http://localhost/api/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: "test-user" }),
    }),
  );
  assertEquals(recordResponse.status, 200);
  assertEquals(await recordResponse.json(), {
    visits: 1,
    lastVisitor: "test-user",
    message: "Visita #1 registrada para test-user.",
  });

  const finalResponse = await handler(
    new Request("http://localhost/api/visits"),
  );
  assertEquals(finalResponse.status, 200);
  assertEquals(await finalResponse.json(), {
    visits: 1,
    lastVisitor: "test-user",
  });
});

test("GET / increments visits before rendering and keeps state in the same handler", async () => {
  const handler = createHandler(new VisitCounter());

  const firstResponse = await handler(new Request("http://localhost/"));
  assertEquals(firstResponse.status, 200);
  assertEquals(
    firstResponse.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assertStringIncludes(await firstResponse.text(), '<div id="count">1</div>');

  const firstVisitsResponse = await handler(
    new Request("http://localhost/api/visits"),
  );
  assertEquals(await firstVisitsResponse.json(), {
    visits: 1,
    lastVisitor: undefined,
  });

  const secondResponse = await handler(new Request("http://localhost/"));
  assertEquals(secondResponse.status, 200);
  assertEquals(
    secondResponse.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assertStringIncludes(await secondResponse.text(), '<div id="count">2</div>');

  const secondVisitsResponse = await handler(
    new Request("http://localhost/api/visits"),
  );
  assertEquals(await secondVisitsResponse.json(), {
    visits: 2,
    lastVisitor: undefined,
  });
});

test("only GET / increments visits", async () => {
  const handler = createHandler(new VisitCounter());

  await handler(new Request("http://localhost/health"));
  await handler(new Request("http://localhost/", { method: "POST" }));
  await handler(new Request("http://localhost/api/visits"));

  const visitsResponse = await handler(
    new Request("http://localhost/api/visits"),
  );
  assertEquals(await visitsResponse.json(), {
    visits: 0,
    lastVisitor: null,
  });
});
