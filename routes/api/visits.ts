import {
  getSharedVisitsService,
  readOptionalVisitorId,
  type VisitsService,
} from "../../visits_state.ts";

const visitsService: VisitsService = getSharedVisitsService();

export function GET(_req: Request): Response {
  const state = visitsService.getState();

  return Response.json({
    visits: state.visits,
    uniqueVisitors: state.uniqueVisitors,
    lastVisitor: state.lastVisitor,
  });
}

export async function POST(req: Request): Promise<Response> {
  const { visitorId, invalidJson } = await readOptionalVisitorId(req);

  if (invalidJson) {
    return Response.json(
      {
        error: "invalid json body",
      },
      { status: 400 },
    );
  }

  const result = visitsService.registerVisit(visitorId);

  return Response.json({
    visits: result.visits,
    uniqueVisitors: result.uniqueVisitors,
    lastVisitor: result.lastVisitor,
    message: result.message,
  });
}
