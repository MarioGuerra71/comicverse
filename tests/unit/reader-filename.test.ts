import { describe, expect, it } from "vitest";
import { naturalCompare, parseComicFileName, seriesKey, yearFromPath } from "@/lib/reader/filename";

describe("parseComicFileName", () => {
  it.each([
    ["Green Lantern 020 (2025) (Digital) (Zone-Empire).cbr", { series: "Green Lantern", issue: "20", year: 2025 }],
    ["Absolute Batman #001 (2024).cbz", { series: "Absolute Batman", issue: "1", year: 2024 }],
    ["Green_Lantern_v6_021.cbr", { series: "Green Lantern", issue: "21", year: null }],
    ["X-Men 1.5 [scan].cbz", { series: "X-Men", issue: "1.5", year: null }],
    ["Absolute Flash 03 of 12 (2025).cbr", { series: "Absolute Flash", issue: "3", year: 2025 }],
    ["Batman - Year One.cbz", { series: "Batman - Year One", issue: null, year: null }],
    // Casos reales de la carpeta del usuario.
    ["Absolute Martian Manhunter #001.cbr", { series: "Absolute Martian Manhunter", issue: "1", year: null }],
    ["Green Lantern - Rebirth #1.cbr", { series: "Green Lantern - Rebirth", issue: "1", year: null }],
    [
      "310 - Green Lantern Corps Recharge #01.howtoarsenio.blogspot.com.cbr",
      { series: "Green Lantern Corps Recharge", issue: "1", year: null },
    ],
    ["02 - Green Lantern #21.cbr", { series: "Green Lantern", issue: "21", year: null }],
    ["Absolute Batman Annual 01.cbz", { series: "Absolute Batman Annual", issue: "1", year: null }],
    ["Absolute Green Lantern 017.cbr", { series: "Absolute Green Lantern", issue: "17", year: null }],
    ["Green Lantern Corps (53).cbr", { series: "Green Lantern Corps", issue: "53", year: null }],
    ["09Green Lantern Corps #60.cbr", { series: "Green Lantern Corps", issue: "60", year: null }],
    ["GL Emerald Warriors 03.cbr", { series: "Green Lantern Emerald Warriors", issue: "3", year: null }],
  ])("%s", (name, expected) => {
    expect(parseComicFileName(name)).toEqual(expected);
  });

  it("si el nombre no trae año, lo toma de la carpeta", () => {
    expect(parseComicFileName("Green Lantern #21.cbr", "GREEN LANTERN 2005/08 - Sinestro").year).toBe(2005);
    expect(yearFromPath("DC UNIVERSO ABSOLUTE/Absolute Batman")).toBeNull();
  });
});

it("seriesKey iguala nombres que solo cambian en signos, mayúsculas o acentos", () => {
  expect(seriesKey("Green Lantern: Rebirth")).toBe(seriesKey("green lantern - Rebirth"));
  expect(seriesKey("Batman & Robin")).toBe("batmanandrobin");
  expect(seriesKey("Pokémon")).toBe("pokemon");
});

it("naturalCompare ordena las páginas por número", () => {
  expect(["10.jpg", "2.jpg", "1.jpg"].sort(naturalCompare)).toEqual(["1.jpg", "2.jpg", "10.jpg"]);
});
