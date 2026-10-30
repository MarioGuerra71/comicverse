import { describe, expect, it } from "vitest";
import { naturalCompare, parseComicFileName, pickBestMatch, searchQuery } from "@/lib/reader/filename";

describe("parseComicFileName", () => {
  it.each([
    ["Green Lantern 020 (2025) (Digital) (Zone-Empire).cbr", { series: "Green Lantern", issue: "20", year: 2025 }],
    ["Absolute Batman #001 (2024).cbz", { series: "Absolute Batman", issue: "1", year: 2024 }],
    ["Green_Lantern_v6_021.cbr", { series: "Green Lantern", issue: "21", year: null }],
    ["X-Men 1.5 [scan].cbz", { series: "X-Men", issue: "1.5", year: null }],
    ["Absolute Flash 03 of 12 (2025).cbr", { series: "Absolute Flash", issue: "3", year: 2025 }],
    ["Batman - Year One.cbz", { series: "Batman - Year One", issue: null, year: null }],
  ])("%s", (name, expected) => {
    expect(parseComicFileName(name)).toEqual(expected);
  });

  it("la búsqueda usa el formato de título del catálogo", () => {
    expect(searchQuery({ series: "Green Lantern", issue: "20", year: null })).toBe("Green Lantern #20");
  });
});

describe("pickBestMatch", () => {
  const comic = (id: string, title: string, date: string | null) => ({
    id,
    title,
    releaseDate: date,
    series: { startYear: null },
  });
  const candidates = [
    comic("old", "Green Lantern #20", "1963-04-01"),
    comic("new", "Green Lantern #20", "2025-03-12"),
    comic("other", "Green Lantern #200", "1986-05-01"),
  ];

  it("con varias series del mismo nombre elige la del año más cercano", () => {
    expect(pickBestMatch(candidates, { series: "Green Lantern", issue: "20", year: 2025 })?.id).toBe("new");
    expect(pickBestMatch(candidates, { series: "Green Lantern", issue: "20", year: 1960 })?.id).toBe("old");
  });

  it("sin año y con dudas no elige; con un solo título exacto, sí", () => {
    expect(pickBestMatch(candidates, { series: "Green Lantern", issue: "20", year: null })).toBeNull();
    expect(pickBestMatch(candidates, { series: "Green Lantern", issue: "200", year: null })?.id).toBe("other");
  });
});

it("naturalCompare ordena las páginas por número", () => {
  expect(["10.jpg", "2.jpg", "1.jpg"].sort(naturalCompare)).toEqual(["1.jpg", "2.jpg", "10.jpg"]);
});
