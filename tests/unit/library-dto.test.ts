import { describe, it, expect } from "vitest";
import { toLibraryEntry, toLibraryItem } from "@/server/dto/library";

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