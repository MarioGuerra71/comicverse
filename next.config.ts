import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las respuestas (la CSP la pone src/proxy.ts).
const securityHeaders = [
  // No adivinar el tipo de archivo: un .txt no se ejecuta como script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir hacia otra web, solo se envía el dominio, no la URL completa.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nadie puede meter ComicVerse en un iframe (clickjacking). Igual que frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // No usamos cámara, micrófono ni ubicación: se bloquean.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Solo HTTPS durante 2 años (los navegadores la ignoran en http://localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // No anunciar "X-Powered-By: Next.js".
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
