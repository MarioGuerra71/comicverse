import { describe, it, expect } from "vitest";
import {
  toComicListItem,
  toComicDetail,
  type ComicListRow,
  type ComicDetailRow,
} from "@/server/dto/comic";

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
describe("toComicDetail", () => {
  const detailRow: ComicDetailRow = {
    id: "c1",
    title: "The Amazing Spider-Man #15",
    storyTitle: "Spider-Man!",
    description: "Una historia.",
    releaseDate: new Date("1962-09-01T00:00:00Z"),
    coverUrl: "https://example.com/cover-large.jpg",
    series: {
      id: "s1",
      name: "The Amazing Spider-Man",
      startYear: 1963,
      publisher: { name: "Marvel" },
    },
    _count: { characters: 19 },
  };

  it("transforma la fila en el DTO público", () => {
    expect(toComicDetail(detailRow)).toEqual({
      id: "c1",
      title: "The Amazing Spider-Man #15",
      storyTitle: "Spider-Man!",
      description: "Una historia.",
      releaseDate: "1962-09-01",
      coverUrl: "https://example.com/cover-large.jpg",
      series: { id: "s1", name: "The Amazing Spider-Man", startYear: 1963 },
      publisher: "Marvel",
      characterCount: 19,
    });
  });

  it("admite campos ausentes y no expone personajes, solo su número", () => {
    const dto = toComicDetail({
      ...detailRow,
      description: null,
      releaseDate: null,
      coverUrl: null,
    });
    expect(dto.description).toBeNull();
    expect(dto.releaseDate).toBeNull();
    expect(dto.coverUrl).toBeNull();
    expect(Object.keys(dto)).not.toContain("characters");
  });
});