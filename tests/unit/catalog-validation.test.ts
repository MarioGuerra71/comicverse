import { describe, it, expect } from "vitest";
import { comicSearchSchema } from "@/server/validation/catalog";

describe("comicSearchSchema", () => {
  it("aplica valores por defecto", () => {
    const result = comicSearchSchema.parse({});
    expect(result).toEqual({ sort: "release_desc", page: 1, pageSize: 24 });
  });

  it("convierte a número los textos de la URL", () => {
    const result = comicSearchSchema.parse({ page: "2", pageSize: "12" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(12);
  });

  it("recorta la búsqueda y trata el texto vacío como ausente", () => {
    expect(comicSearchSchema.parse({ q: "  goblin  " }).q).toBe("goblin");
    expect(comicSearchSchema.parse({ q: "   " }).q).toBeUndefined();
  });

  it("rechaza tamaños de página excesivos", () => {
    expect(comicSearchSchema.safeParse({ pageSize: "1000" }).success).toBe(false);
  });

  it("rechaza páginas menores que 1", () => {
    expect(comicSearchSchema.safeParse({ page: "0" }).success).toBe(false);
  });

  it("rechaza órdenes no permitidos", () => {
    expect(comicSearchSchema.safeParse({ sort: "DROP TABLE" }).success).toBe(false);
  });

  it("rechaza identificadores de serie que no son UUID", () => {
    expect(comicSearchSchema.safeParse({ seriesId: "abc" }).success).toBe(false);
  });
});