import { assertEquals } from "@std/assert";
import { formatCounterMessage, VisitCounter } from "./counter.ts";

Deno.test("VisitCounter increments", () => {
  const c = new VisitCounter();
  assertEquals(c.state.visits, 0);
  c.recordVisit("a");
  assertEquals(c.state.visits, 1);
  assertEquals(c.state.lastVisitor, "a");
});

Deno.test("formatCounterMessage pt-BR", () => {
  assertEquals(
    formatCounterMessage({ visits: 2, updatedAt: new Date().toISOString() }),
    "2 visitas registradas.",
  );
});
