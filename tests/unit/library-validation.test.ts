import { describe, it, expect } from "vitest";
import {
  comicIdSchema,
  librarySearchSchema,
  setStatusSchema,
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