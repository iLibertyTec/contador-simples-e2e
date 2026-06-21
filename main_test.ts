import { assertEquals, assertStringIncludes } from "@std/assert";

import { VisitCounter } from "./counter.ts";
import { createHandler } from "./main.ts";

Deno.test("createHandler uses isolated counter state for visits route", async () => {
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

Deno.test("GET / increments visits before rendering and keeps state in the same handler", async () => {
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

Deno.test("only GET / increments visits", async () => {
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

Deno.test("GET /health before GET / does not increment the homepage counter", async () => {
  const handler = createHandler(new VisitCounter());

  const healthResponse = await handler(new Request("http://localhost/health"));
  assertEquals(healthResponse.status, 200);
  assertEquals(await healthResponse.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });

  const homepageResponse = await handler(new Request("http://localhost/"));
  assertEquals(homepageResponse.status, 200);
  assertStringIncludes(
    await homepageResponse.text(),
    '<div id="count">1</div>',
  );
});

Deno.test("GET /health after GET / does not alter the next homepage counter value", async () => {
  const handler = createHandler(new VisitCounter());

  const firstHomepageResponse = await handler(new Request("http://localhost/"));
  assertEquals(firstHomepageResponse.status, 200);
  assertStringIncludes(
    await firstHomepageResponse.text(),
    '<div id="count">1</div>',
  );

  const healthResponse = await handler(new Request("http://localhost/health"));
  assertEquals(healthResponse.status, 200);
  assertEquals(await healthResponse.json(), {
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });

  const secondHomepageResponse = await handler(
    new Request("http://localhost/"),
  );
  assertEquals(secondHomepageResponse.status, 200);
  assertStringIncludes(
    await secondHomepageResponse.text(),
    '<div id="count">2</div>',
  );
});
