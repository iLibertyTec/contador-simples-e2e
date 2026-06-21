import { assertEquals } from "@std/assert";
import { formatCounterMessage, VisitCounter } from "./counter.ts";

Deno.test("VisitCounter inicia com estado zerado por instância", () => {
  const firstCounter = new VisitCounter();
  const secondCounter = new VisitCounter();

  assertEquals(firstCounter.state.visits, 0);
  assertEquals(secondCounter.state.visits, 0);
  assertEquals(firstCounter.state.lastVisitor, undefined);
  assertEquals(secondCounter.state.lastVisitor, undefined);
});

Deno.test("VisitCounter increments", () => {
  const c = new VisitCounter();

  assertEquals(c.state.visits, 0);

  const firstState = c.recordVisit("a");
  assertEquals(firstState.visits, 1);
  assertEquals(firstState.lastVisitor, "a");
  assertEquals(c.state.visits, 1);

  const secondState = c.recordVisit("b");
  assertEquals(secondState.visits, 2);
  assertEquals(secondState.lastVisitor, "b");
  assertEquals(c.state.visits, 2);
});

Deno.test("formatCounterMessage pt-BR", () => {
  assertEquals(
    formatCounterMessage({ visits: 2, updatedAt: new Date().toISOString() }),
    "2 visitas registradas.",
  );
});
