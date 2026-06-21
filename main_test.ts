import { assertEquals } from "@std/assert";

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
