import { describe, expect, it } from "vitest";
import {
  isDiscovered,
  MIN_SHARED_COMICS,
  pickRelationships,
} from "@/server/domain/relationships";

describe("pickRelationships", () => {
  it("calcula la puntuación de Ochiai: compartidos / √(cómicsA · cómicsB)", () => {
    const [rel] = pickRelationships(
      [{ a: "venom", b: "eddie", shared: 45 }],
      new Map([
        ["venom", 100],
        ["eddie", 81],
      ]),
    );
    expect(rel.score).toBeCloseTo(45 / 90);
  });

  it("descarta parejas con pocos cómics compartidos aunque la puntuación sea alta", () => {
    const counts = new Map([
      ["a", MIN_SHARED_COMICS - 1],
      ["b", MIN_SHARED_COMICS - 1],
    ]);
    expect(pickRelationships([{ a: "a", b: "b", shared: MIN_SHARED_COMICS - 1 }], counts)).toEqual([]);
  });

  it("descarta coincidencias de un personaje que sale en todas partes", () => {
    // 40 cómics juntos, pero la tía May sale en 377 y Venom en 140: 40 / √(377·140) ≈ 0,17 < 0,2.
    const counts = new Map([
      ["may", 377],
      ["venom", 140],
      ["carnage", 25],
    ]);
    const result = pickRelationships(
      [
        { a: "may", b: "venom", shared: 40 },
        { a: "carnage", b: "venom", shared: 15 },
      ],
      counts,
    );
    expect(result.map((r) => `${r.a}+${r.b}`)).toEqual(["carnage+venom"]);
  });
});

describe("isDiscovered", () => {
  it("solo con los dos personajes desbloqueados", () => {
    const rel = { a: "a", b: "b", shared: 10 };
    expect(isDiscovered(rel, new Set(["a", "b"]))).toBe(true);
    expect(isDiscovered(rel, new Set(["a"]))).toBe(false);
    expect(isDiscovered(rel, new Set())).toBe(false);
  });
});

describe("pickRelationships con relaciones curadas", () => {
  const counts = new Map([
    ["may", 377],
    ["ben", 50],
    ["spidey", 800],
    ["goblin", 200],
  ]);

  it("una curada cuenta aunque no llegue a los umbrales, y lleva su tipo", () => {
    const [rel] = pickRelationships([{ a: "ben", b: "may", shared: 2 }], counts, [
      { a: "may", b: "ben", type: "PARTNER" }, // orden distinto: es la misma pareja
    ]);
    expect(rel).toMatchObject({ shared: 2, type: "PARTNER" });
  });

  it("añade el tipo a una pareja que ya era significativa", () => {
    const [rel] = pickRelationships([{ a: "goblin", b: "spidey", shared: 150 }], counts, [
      { a: "spidey", b: "goblin", type: "ENEMY" },
    ]);
    expect(rel).toMatchObject({ shared: 150, type: "ENEMY" });
  });

  it("incluye curadas sin cómics compartidos y deja sin tipo las derivadas", () => {
    const result = pickRelationships([{ a: "goblin", b: "spidey", shared: 150 }], counts, [
      { a: "ben", b: "goblin", type: "RIVAL" },
    ]);
    expect(result.map((r) => [r.shared, r.type])).toEqual([
      [150, null],
      [0, "RIVAL"],
    ]);
  });
});
