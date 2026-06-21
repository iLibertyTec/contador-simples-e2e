import {
  getSharedVisitsService,
  readOptionalVisitorId,
} from "../../visits_state.ts";

export function GET(_req: Request): Response {
  const state = getSharedVisitsService().getState();

  return Response.json({
    visits: state.visits,
    uniqueVisitors: state.uniqueVisitors,
    lastVisitor: state.lastVisitor,
  });
}

export async function POST(req: Request): Promise<Response> {
  const parsedBody = await readOptionalVisitorId(req);

  if (!parsedBody.valid) {
    return Response.json(
      {
        error: parsedBody.error,
      },
      { status: 400 },
    );
  }

  const result = getSharedVisitsService().registerVisit(parsedBody.visitorId);

  return Response.json({
    visits: result.visits,
    uniqueVisitors: result.uniqueVisitors,
    lastVisitor: result.lastVisitor,
    message: result.message,
  });
}
