import { formatCounterMessage, VisitCounter } from "./counter.ts";

const counter = new VisitCounter();

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return new Response(JSON.stringify({
      ok: true,
      service: "contador",
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  if (url.pathname === "/api/visits" && req.method === "GET") {
    return Response.json(counter.state);
  }

  if (url.pathname === "/api/visits" && req.method === "POST") {
    const body = req.headers.get("content-type")?.includes("json")
      ? await req.json().catch(() => ({}))
      : {};
    const visitorId = typeof body.visitorId === "string"
      ? body.visitorId
      : undefined;
    const state = counter.recordVisit(visitorId);
    return Response.json({
      ...state,
      message: formatCounterMessage(state),
    });
  }

  if (url.pathname === "/") {
    const html = "<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>Contador</title></head><body><h1>Contador</h1></body></html>";
    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return Response.json({ error: "not found" }, { status: 404 });
}

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT") ?? 8000);
  console.log(`iFactory Product on http://localhost:${port}`);
  Deno.serve({ port }, handler);
}
