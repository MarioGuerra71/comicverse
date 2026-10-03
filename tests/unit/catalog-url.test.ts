import { describe, it, expect } from "vitest";
import { buildCatalogHref } from "@/lib/catalog-url";

describe("buildCatalogHref", () => {
  it("devuelve /catalog sin parámetros", () => {
    expect(buildCatalogHref({})).toBe("/catalog");
  });

  it("codifica la búsqueda", () => {
    expect(buildCatalogHref({ q: "green goblin" })).toBe("/catalog?q=green+goblin");
  });

  it("omite los valores por defecto y conserva el resto", () => {
    expect(buildCatalogHref({ sort: "release_desc", page: 1 })).toBe("/catalog");
    expect(buildCatalogHref({ seriesId: "abc", sort: "title", page: 2 })).toBe(
      "/catalog?seriesId=abc&sort=title&page=2",
    );
  });
});