import {
  getSharedVisitsService,
  readOptionalVisitorId,
  type VisitsService,
} from "../../visits_state.ts";

const visitsService: VisitsService = getSharedVisitsService();

export function GET(_req: Request): Response {
  return Response.json(visitsService.getState());
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

  return Response.json(visitsService.registerVisit(visitorId));
}
