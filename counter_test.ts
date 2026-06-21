import { assertEquals } from "@std/assert";
import { formatCounterMessage, VisitCounter } from "./counter.ts";

Deno.test("VisitCounter starts with initial state", () => {
  const counter = new VisitCounter();

  assertEquals(counter.state.visits, 0);
  assertEquals(counter.state.lastVisitor, undefined);
  assertEquals(typeof counter.state.updatedAt, "string");
});

Deno.test("VisitCounter records multiple visits independently", () => {
  const counter = new VisitCounter();

  counter.recordVisit("a");
  counter.recordVisit("b");
  counter.recordVisit("b");

  assertEquals(counter.state.visits, 3);
  assertEquals(counter.state.lastVisitor, "b");
});

Deno.test("formatCounterMessage pt-BR", () => {
  assertEquals(
    formatCounterMessage({ visits: 2, updatedAt: new Date().toISOString() }),
    "2 visitas registradas.",
  );
});
