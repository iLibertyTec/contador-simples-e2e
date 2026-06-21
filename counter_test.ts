import { assertEquals } from "@std/assert";
import { formatCounterMessage, VisitCounter } from "./counter.ts";

Deno.test("VisitCounter inicia com visits igual a 0", () => {
  const counter: VisitCounter = new VisitCounter();

  assertEquals(counter.state.visits, 0);
});

Deno.test("VisitCounter incrementVisit incrementa uma visita por chamada", () => {
  const counter: VisitCounter = new VisitCounter();

  const firstState = counter.incrementVisit();
  const secondState = counter.incrementVisit();

  assertEquals(firstState.visits, 1);
  assertEquals(secondState.visits, 2);
  assertEquals(counter.state.visits, 2);
});

Deno.test("VisitCounter recordVisit mantém compatibilidade e registra último visitante", () => {
  const counter: VisitCounter = new VisitCounter();

  const state = counter.recordVisit("a");

  assertEquals(state.visits, 1);
  assertEquals(state.lastVisitor, "a");
  assertEquals(counter.state.lastVisitor, "a");
});

Deno.test("formatCounterMessage pt-BR", () => {
  assertEquals(
    formatCounterMessage({ visits: 2, updatedAt: new Date().toISOString() }),
    "2 visitas registradas.",
  );
});
