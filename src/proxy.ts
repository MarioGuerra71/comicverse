import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, isCrossSiteWrite } from "@/lib/security";
import { BRAND_VISITS_COOKIE } from "@/lib/zones";

const BRAND_PAGES = new Set(["/", "/sign-in", "/sign-up"]);

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

  // Portada y acceso: cuenta las visitas (solo cargas completas, no la navegación interna) para
  // alternar la editorial del bloque. La página ya ve el valor nuevo (incluye esta visita).
  if (BRAND_PAGES.has(pathname) && request.headers.get("sec-fetch-dest") === "document") {
    const visits = Number(request.cookies.get(BRAND_VISITS_COOKIE)?.value) || 0;
    response.cookies.set(BRAND_VISITS_COOKIE, String(Math.min(visits + 1, 99)), {
      path: "/",
      maxAge: 31_536_000,
      sameSite: "lax",
    });
  }
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
