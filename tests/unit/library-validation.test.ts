import { describe, it, expect } from "vitest";
import {
  comicIdSchema,
  librarySearchSchema,
  setStatusSchema,
  updateEntrySchema,
} from "@/server/validation/library";

describe("setStatusSchema", () => {
  it("acepta los cuatro estados", () => {
    for (const status of ["PENDING", "READING", "READ", "DROPPED"]) {
      expect(setStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rechaza estados desconocidos, minúsculas o la ausencia de estado", () => {
    expect(setStatusSchema.safeParse({ status: "BOGUS" }).success).toBe(false);
    expect(setStatusSchema.safeParse({ status: "read" }).success).toBe(false);
    expect(setStatusSchema.safeParse({}).success).toBe(false);
  });

  it("ignora campos extra como userId", () => {
    const result = setStatusSchema.parse({ status: "READ", userId: "otro" });
    expect(result).toEqual({ status: "READ" });
  });
});

describe("librarySearchSchema", () => {
  it("aplica valores por defecto", () => {
    expect(librarySearchSchema.parse({})).toEqual({ page: 1, pageSize: 24 });
  });

  it("acepta un filtro de estado y rechaza uno inválido", () => {
    expect(librarySearchSchema.parse({ status: "READ" }).status).toBe("READ");
    expect(librarySearchSchema.safeParse({ status: "x" }).success).toBe(false);
  });

  it("limita el tamaño de página", () => {
    expect(librarySearchSchema.safeParse({ pageSize: "500" }).success).toBe(false);
  });
});

describe("comicIdSchema", () => {
  it("solo acepta UUID", () => {
    expect(comicIdSchema.safeParse("no-es-un-uuid").success).toBe(false);
    expect(comicIdSchema.safeParse("32230dd0-289a-47a4-ae79-8d31e6403508").success).toBe(true);
  });
});
describe("updateEntrySchema", () => {
  it("acepta puntuaciones enteras de 1 a 5, null y el favorito", () => {
    expect(updateEntrySchema.safeParse({ rating: 1 }).success).toBe(true);
    expect(updateEntrySchema.safeParse({ rating: 5 }).success).toBe(true);
    expect(updateEntrySchema.safeParse({ rating: null }).success).toBe(true);
    expect(updateEntrySchema.safeParse({ isFavorite: true }).success).toBe(true);
  });

  it("rechaza puntuaciones fuera de rango o con decimales", () => {
    expect(updateEntrySchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(updateEntrySchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(updateEntrySchema.safeParse({ rating: 3.5 }).success).toBe(false);
    expect(updateEntrySchema.safeParse({ rating: "4" }).success).toBe(false);
  });

  it("exige al menos un campo y descarta el resto", () => {
    expect(updateEntrySchema.safeParse({}).success).toBe(false);
    expect(updateEntrySchema.safeParse({ status: "READ" }).success).toBe(false);
    expect(updateEntrySchema.parse({ isFavorite: false, userId: "otro" })).toEqual({
      isFavorite: false,
    });
  });
});
