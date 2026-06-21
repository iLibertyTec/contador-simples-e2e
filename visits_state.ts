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

export type OptionalVisitorIdResult =
  | {
    valid: true;
    visitorId?: string;
  }
  | {
    valid: false;
    error: "invalid json body" | "unsupported media type";
  };

function cloneState(state: VisitsState): VisitsState {
  return {
    visits: state.visits,
    uniqueVisitors: state.uniqueVisitors,
    lastVisitor: state.lastVisitor,
  };
}

function isJsonMediaType(contentType: string | null): boolean {
  if (contentType === null) {
    return false;
  }

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";

  return mediaType === "application/json";
}

export async function readOptionalVisitorId(
  req: Request,
): Promise<OptionalVisitorIdResult> {
  const contentType = req.headers.get("content-type");
  const contentLength = req.headers.get("content-length");

  if (contentLength === "0") {
    return { valid: true };
  }

  if (!isJsonMediaType(contentType)) {
    const bodyText = await req.text();

    if (bodyText === "") {
      return { valid: true };
    }

    return {
      valid: false,
      error: "unsupported media type",
    };
  }

  const bodyText = await req.text();

  if (bodyText.trim() === "") {
    return { valid: true };
  }

  let body: unknown;

  try {
    body = JSON.parse(bodyText);
  } catch {
    return {
      valid: false,
      error: "invalid json body",
    };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      valid: false,
      error: "invalid json body",
    };
  }

  const entries = Object.entries(body);

  for (const [key, value] of entries) {
    if (key !== "visitorId") {
      return {
        valid: false,
        error: "invalid json body",
      };
    }

    if (typeof value !== "string") {
      return {
        valid: false,
        error: "invalid json body",
      };
    }
  }

  if ("visitorId" in body) {
    return {
      valid: true,
      visitorId: body.visitorId,
    };
  }

  return { valid: true };
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
