export function GET(_req: Request): Response {
  return Response.json({
    ok: true,
    service: "ifactory-product",
    version: "0.1.0",
  });
}
