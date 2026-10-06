import { describe, expect, it } from "vitest";
import { buildCsp, isCrossSiteWrite } from "@/lib/security";

const own = "https://comicverse.vercel.app";
const headers = (h: Record<string, string>) => new Headers(h);

describe("isCrossSiteWrite", () => {
  it("bloquea escrituras desde otra web", () => {
    expect(isCrossSiteWrite("PUT", headers({ origin: "https://malo.example" }), own)).toBe(true);
    expect(isCrossSiteWrite("DELETE", headers({ "sec-fetch-site": "cross-site" }), own)).toBe(true);
  });

  it("deja pasar las de nuestra web, las lecturas y los clientes sin navegador", () => {
    expect(isCrossSiteWrite("PATCH", headers({ origin: own, "sec-fetch-site": "same-origin" }), own)).toBe(false);
    expect(isCrossSiteWrite("GET", headers({ origin: "https://malo.example" }), own)).toBe(false);
    expect(isCrossSiteWrite("PUT", headers({}), own)).toBe(false);
  });
});

describe("buildCsp", () => {
  it("solo permite scripts con el nonce y nada de iframes ni objetos", () => {
    const csp = buildCsp("abc123", { isDev: false, isHttps: true });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("https://comicvine.gamespot.com");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("en desarrollo añade unsafe-eval", () => {
    expect(buildCsp("abc123", { isDev: true, isHttps: false })).toContain("'unsafe-eval'");
  });

  it("solo fuerza https cuando ya se sirve por https", () => {
    expect(buildCsp("abc123", { isDev: false, isHttps: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });
});
