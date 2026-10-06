import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, isCrossSiteWrite } from "@/lib/security";

// Se ejecuta antes de cada petición que coincide con `config.matcher`.
export function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // API: rechazar escrituras que vienen de otra web (segunda capa tras SameSite=Lax).
  if (pathname.startsWith("/api/")) {
    if (isCrossSiteWrite(request.method, request.headers, origin)) {
      return Response.json({ error: "CROSS_SITE_REQUEST" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Páginas: CSP con un nonce nuevo en cada petición (Next lo aplica a sus scripts).
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, {
    isDev: process.env.NODE_ENV === "development",
    isHttps: request.nextUrl.protocol === "https:",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Todo menos archivos estáticos y prefetch de next/link (no necesitan CSP).
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
