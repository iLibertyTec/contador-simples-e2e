import { formatCounterMessage, VisitCounter } from "./counter.ts";

function buildVisitMessage(state: {
  visits: number;
  lastVisitor: string | null;
}): string {
  return formatCounterMessage(state) ||
    `Total de visitas: ${state.visits}. Última visita: ${state.lastVisitor ?? "anônima"}.`;
}

export function createHandler(counter: VisitCounter = new VisitCounter()) {
  return async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "ifactory-product",
        version: "0.1.0",
      });
    }

    if (url.pathname === "/api/visits" && req.method === "GET") {
      return Response.json(counter.state);
    }

    if (url.pathname === "/api/visits" && req.method === "POST") {
      const state = counter.recordVisit();
      return Response.json(state, { status: 201 });
    }

    if (url.pathname === "/" && req.method === "GET") {
      const state = counter.recordVisit();
      const message = buildVisitMessage(state);
      const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>iFactory Product — Visit Analytics</title>
<style>
:root{--bg:#080b17;--panel:#141b34;--ink:#eaeefa;--mut:#8b95b8;--accent:#4c8dff}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;display:grid;place-items:center}
.card{background:var(--panel);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:36px;text-align:center;max-width:420px;width:90%}
h1{font-size:1.35rem;margin-bottom:8px}
p{color:var(--mut);font-size:.95rem;margin-top:16px}
#count{font-size:3rem;font-weight:700;color:var(--accent);margin-top:12px}
</style></head>
<body><div class="card">
<h1>Visit Analytics</h1>
<div id="count">${state.visits}</div>
<p id="msg">${message}</p>
</div></body></html>`;
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return Response.json({ error: "not found" }, { status: 404 });
  };
}

export const handler = createHandler();

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT") ?? 8000);
  console.log(`iFactory Product on http://localhost:${port}`);
  Deno.serve({ port }, handler);
}
