import { VisitCounter } from "./counter.ts";
import { createVisitsService } from "./visits_state.ts";

const testCounter: VisitCounter = new VisitCounter();
const testVisitsService = createVisitsService(testCounter);

export function resetVisitsStateForTest(): void {
  testCounter.reset();
}

export function getTestVisitsService() {
  return testVisitsService;
}
