import { formatCounterMessage, VisitCounter } from "./counter.ts";

const counter: VisitCounter = new VisitCounter();

export function getVisitsState(): ReturnType<VisitCounter["recordVisit"]> {
  return counter.state;
}

export function recordVisit(visitorId?: string): {
  visits: number;
  uniqueVisitors: number;
  lastVisitor: string | null;
  message: string;
} {
  const state = counter.recordVisit(visitorId);

  return {
    ...state,
    message: formatCounterMessage(state),
  };
}
