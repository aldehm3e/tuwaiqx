import { isOriginAllowed } from "@/src/lib/security/origins";

export async function corsHeaders(request: Request, pageUrl?: string | null) {
  const origin = request.headers.get("origin");
  const allowed = await isOriginAllowed(origin, pageUrl);
  if (!allowed) {
    return null;
  }

  return {
    "access-control-allow-origin": origin || "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin"
  };
}

