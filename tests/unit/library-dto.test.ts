import { describe, it, expect } from "vitest";
import { groupBySeries, sortSeriesFolders, toLibraryEntry, toLibraryItem } from "@/server/dto/library";

describe("toLibraryEntry", () => {
  it("convierte las fechas a texto ISO y conserva el resto", () => {
    expect(
      toLibraryEntry({
        comicId: "c1",
        status: "READ",
        isFavorite: false,
        rating: null,
        startedAt: null,
        readAt: new Date("2026-10-03T10:00:00Z"),
      }),
    ).toEqual({
      comicId: "c1",
      status: "READ",
      isFavorite: false,
      rating: null,
      startedAt: null,
      readAt: "2026-10-03T10:00:00.000Z",
    });
  });
});

describe("puntuación oculta fuera de Leído", () => {
  it("muestra la puntuación en Leído y la oculta en otros estados", () => {
    const row = {
      comicId: "c1",
      isFavorite: false,
      rating: 4,
      startedAt: null,
      readAt: null,
    };
    expect(toLibraryEntry({ ...row, status: "READ" }).rating).toBe(4);
    expect(toLibraryEntry({ ...row, status: "DROPPED" }).rating).toBeNull();
  });
});

describe("toLibraryItem", () => {
  it("incluye el cómic con solo el número de personajes", () => {
    const item = toLibraryItem({
      status: "PENDING",
      isFavorite: true,
      rating: null,
      startedAt: null,
      readAt: null,
      updatedAt: new Date("2026-10-03T10:00:00Z"),
      comic: {
        id: "c1",
        title: "The Amazing Spider-Man #1",
        storyTitle: null,
        releaseDate: null,
        coverThumbUrl: null,
        series: {
          id: "s1",
          name: "The Amazing Spider-Man",
          startYear: 1963,
          publisher: { name: "Marvel" },
        },
        _count: { characters: 7 },
      },
    });

    expect(item.comic.characterCount).toBe(7);
    expect(Object.keys(item.comic)).not.toContain("characters");
    expect(item.updatedAt).toBe("2026-10-03T10:00:00.000Z");
  });
});
describe("groupBySeries", () => {
  const entry = (seriesId: string, status: "READ" | "PENDING", cover: string | null) => ({
    status,
    comic: { coverThumbUrl: cover, series: { id: seriesId, name: `Serie ${seriesId}`, startYear: 2024, _count: { comics: 100 } } },
  });

  it("agrupa por serie en el orden de llegada, cuenta leídos sobre el total de la serie y guarda hasta 3 portadas", () => {
    const groups = groupBySeries([
      entry("b", "READ", "b1"),
      entry("a", "PENDING", "a1"),
      entry("b", "PENDING", null),
      entry("b", "READ", "b2"),
      entry("b", "READ", "b3"),
      entry("b", "READ", "b4"),
    ]);
    expect(groups.map((g) => g.id)).toEqual(["b", "a"]);
    expect(groups[0]).toMatchObject({ total: 100, read: 4, covers: ["b1", "b2", "b3"] });
    expect(groups[1]).toMatchObject({ total: 100, read: 0, covers: ["a1"] });
    expect(Object.keys(groups[0])).not.toContain("_count");
  });
});

describe("sortSeriesFolders", () => {
  const folder = (id: string, read: number, total: number) => ({ id, name: id, startYear: null, covers: [], total, read });
  const folders = [folder("Zeta", 0, 10), folder("Alfa", 10, 10), folder("Beta", 2, 10), folder("Gamma", 8, 10)];

  it("«recientes» deja el orden tal cual", () => {
    expect(sortSeriesFolders(folders, "recent").map((f) => f.id)).toEqual(["Zeta", "Alfa", "Beta", "Gamma"]);
  });

  it("«casi terminadas»: empezadas por porcentaje, luego sin empezar y al final las completas", () => {
    expect(sortSeriesFolders(folders, "closest").map((f) => f.id)).toEqual(["Gamma", "Beta", "Zeta", "Alfa"]);
  });

  it("«A-Z» ordena por nombre", () => {
    expect(sortSeriesFolders(folders, "name").map((f) => f.id)).toEqual(["Alfa", "Beta", "Gamma", "Zeta"]);
  });
});
