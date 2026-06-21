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

  if (url.pathname === "/") {
    const html = "<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>Contador</title></head><body><h1>Contador</h1></body></html>";
    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
    headers: {
      "content-type": "application/json",
    },
  });
}

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT") ?? 8000);
  console.log(`iFactory Product on http://localhost:${port}`);
  Deno.serve({ port }, handler);
}
