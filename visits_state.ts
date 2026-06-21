import { formatCounterMessage, VisitCounter } from "./counter.ts";

export type VisitsState = {
  visits: number;
  uniqueVisitors: number;
  lastVisitor: string | null;
};

export type VisitRecordResult = VisitsState & {
  message: string;
};

export type VisitsService = {
  getState(): VisitsState;
  registerVisit(visitorId?: string): VisitRecordResult;
};

export type OptionalVisitorIdResult = {
  visitorId?: string;
  invalidJson: boolean;
};

function cloneState(state: VisitsState): VisitsState {
  return {
    visits: state.visits,
    uniqueVisitors: state.uniqueVisitors,
    lastVisitor: state.lastVisitor,
  };
}

export async function readOptionalVisitorId(
  req: Request,
): Promise<OptionalVisitorIdResult> {
  const contentType = req.headers.get("content-type");

  if (!contentType?.includes("json")) {
    return { invalidJson: false };
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return { invalidJson: true };
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "visitorId" in body &&
    typeof body.visitorId === "string"
  ) {
    return {
      visitorId: body.visitorId,
      invalidJson: false,
    };
  }

  return { invalidJson: false };
}

export function createVisitsService(counter: VisitCounter): VisitsService {
  return {
    getState(): VisitsState {
      return cloneState(counter.state);
    },
    registerVisit(visitorId?: string): VisitRecordResult {
      const state = counter.recordVisit(visitorId);
      const snapshot: VisitsState = cloneState(state);

      return {
        ...snapshot,
        message: formatCounterMessage(snapshot),
      };
    },
  };
}

const sharedCounter: VisitCounter = new VisitCounter();
const sharedVisitsService: VisitsService = createVisitsService(sharedCounter);

export function getSharedVisitsService(): VisitsService {
  return sharedVisitsService;
}
