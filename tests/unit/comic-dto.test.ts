import { describe, it, expect } from "vitest";
import { toComicListItem, type ComicListRow } from "@/server/dto/comic";

const row: ComicListRow = {
  id: "c1",
  title: "The Amazing Spider-Man #15",
  storyTitle: "Spider-Man!",
  releaseDate: new Date("1962-09-01T00:00:00Z"),
  coverThumbUrl: "https://example.com/cover.jpg",
  series: {
    id: "s1",
    name: "The Amazing Spider-Man",
    startYear: 1963,
    publisher: { name: "Marvel" },
  },
  _count: { characters: 19 },
};

describe("toComicListItem", () => {
  it("transforma la fila en el DTO público", () => {
    expect(toComicListItem(row)).toEqual({
      id: "c1",
      title: "The Amazing Spider-Man #15",
      storyTitle: "Spider-Man!",
      releaseDate: "1962-09-01",
      coverThumbUrl: "https://example.com/cover.jpg",
      series: { id: "s1", name: "The Amazing Spider-Man", startYear: 1963 },
      publisher: "Marvel",
      characterCount: 19,
    });
  });

  it("admite fechas ausentes y no expone personajes, solo su número", () => {
    const dto = toComicListItem({ ...row, releaseDate: null });
    expect(dto.releaseDate).toBeNull();
    expect(Object.keys(dto)).not.toContain("characters");
    expect(dto.characterCount).toBe(19);
  });
});