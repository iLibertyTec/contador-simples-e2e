import { formatCounterMessage, VisitCounter } from "./counter.ts";

export type VisitsState = {
  visits: number;
  uniqueVisitors: number;
  lastVisitor: string | null;
};

export type VisitRecordResult = VisitsState & {
  message: string;
};

const counter: VisitCounter = new VisitCounter();

function cloneState(state: VisitsState): VisitsState {
  return {
    visits: state.visits,
    uniqueVisitors: state.uniqueVisitors,
    lastVisitor: state.lastVisitor,
  };
}

export function getVisitsState(): VisitsState {
  return cloneState(counter.state);
}

export function registerVisit(visitorId?: string): VisitRecordResult {
  const state = counter.recordVisit(visitorId);
  const snapshot: VisitsState = cloneState(state);

  return {
    ...snapshot,
    message: formatCounterMessage(snapshot),
  };
}

export function resetVisitsStateForTest(): void {
  counter.reset();
}
