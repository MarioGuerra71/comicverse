import { describe, expect, it } from "vitest";
import { diffById } from "@/server/domain/unlock";
import { toCharacterSummary, toCollection } from "@/server/dto/character";

describe("diffById", () => {
  it("separa lo ganado de lo perdido", () => {
    const a = { id: "a" };
    const b = { id: "b" };
    const c = { id: "c" };
    expect(diffById([a, b], [b, c])).toEqual({ gained: [c], lost: [a] });
  });

  it("sin cambios no hay ni ganados ni perdidos", () => {
    expect(diffById([{ id: "a" }], [{ id: "a" }])).toEqual({ gained: [], lost: [] });
  });
});

describe("toCharacterSummary", () => {
  it("usa el displayName si existe y si no el nombre", () => {
    const row = {
      id: "1",
      name: "Norman Osborn",
      displayName: "Green Goblin",
      imageThumbUrl: null,
    };
    expect(toCharacterSummary(row).name).toBe("Green Goblin");
    expect(toCharacterSummary({ ...row, displayName: null }).name).toBe("Norman Osborn");
  });
});

describe("toCollection", () => {
  const row = (id: string, name: string, comicsRead: number, catalogNumber: number | null = null) => ({
    id,
    name,
    displayName: null,
    catalogNumber,
    realName: `Real ${name}`,
    imageThumbUrl: `https://img.test/${id}.jpg`,
    favorites: [],
    _count: { comics: comicsRead },
  });

  it("no envía ningún dato de los personajes bloqueados, solo cuántos son", () => {
    const result = toCollection([
      row("id-spidey", "Spider-Man", 1),
      row("id-secret", "Personaje Secreto", 0),
    ]);

    const json = JSON.stringify(result);
    expect(json).not.toContain("Personaje Secreto");
    expect(json).not.toContain("id-secret");
    expect(json).not.toContain("https://img.test/id-secret.jpg");
    expect(result.locked).toBe(1);
    expect(result.progress).toEqual({ unlocked: 1, total: 2 });
  });

  it("de los bloqueados solo envía el número de catálogo, para dejar su hueco", () => {
    const result = toCollection([
      row("id-spidey", "Spider-Man", 1, 1),
      row("id-secret", "Personaje Secreto", 0, 17),
    ]);

    expect(result.lockedNumbers).toEqual([17]);
    expect(JSON.stringify(result)).not.toContain("Personaje Secreto");
    expect(JSON.stringify(result)).not.toContain("id-secret");
  });

  it("ordena las cartas por número de catálogo; sin número, al final", () => {
    const { cards } = toCollection([
      row("z", "Zeta", 1, null),
      row("b", "Beta", 1, 2),
      row("a", "Alfa", 1, 9),
    ]);
    expect(cards.map((c) => [c.name, c.number])).toEqual([
      ["Beta", 2],
      ["Alfa", 9],
      ["Zeta", null],
    ]);
  });

  it("calcula el estado de cada carta desbloqueada", () => {
    const { cards } = toCollection([row("a", "A", 1), row("b", "B", 5)]);
    expect(cards.map((c) => [c.name, c.state, c.comicsRead])).toEqual([
      ["A", "DISCOVERED", 1],
      ["B", "COLLECTED", 5],
    ]);
  });
});
