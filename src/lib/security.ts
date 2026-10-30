// Reglas de seguridad HTTP (puras, con tests). Las aplica src/proxy.ts.

/**
 * De dónde cargamos imágenes: Comic Vine (hotlinking) y cualquier web con HTTPS, porque cada
 * usuario puede pegar el enlace que quiera para la imagen de un personaje (solo la ve él).
 * Una imagen no ejecuta código; lo peligroso (scripts) sigue limitado por script-src.
 */
const IMAGE_HOSTS = ["https://comicvine.gamespot.com", "https:"];

/**
 * Content Security Policy con nonce: el navegador solo ejecuta scripts que lleven el nonce
 * de esta petición (los de Next se lo ponen solos), así un script inyectado no se ejecuta.
 * style-src permite estilos en línea: React Flow y next/image posicionan con style="".
 */
export function buildCsp(nonce: string, { isDev, isHttps }: { isDev: boolean; isHttps: boolean }) {
  return [
    "default-src 'self'",
    // 'unsafe-eval' solo en desarrollo: React lo usa para mostrar mejor los errores.
    // 'wasm-unsafe-eval': el lector descomprime los .cbr con WebAssembly (no permite eval de JS).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${IMAGE_HOSTS.join(" ")}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Solo con HTTPS: en http://localhost (también con npm start) rompería la carga.
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF: ¿es una escritura lanzada desde otra web? Los navegadores envían Origin y
 * Sec-Fetch-Site en estas peticiones; un cliente sin navegador (curl) no las envía, pero
 * tampoco lleva la cookie de una víctima, así que no es CSRF.
 */
export function isCrossSiteWrite(method: string, headers: Headers, ownOrigin: string) {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  if (headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = headers.get("origin");
  return origin !== null && origin !== ownOrigin;
}
