import { describe, expect, it } from "vitest";
import { filterCards, type CollectionCardDto } from "@/server/dto/character";
import { collectionSearchSchema, favoriteSchema } from "@/server/validation/collection";

const card = (
  name: string,
  comicsRead: number,
  isFavorite = false,
  number: number | null = null,
): CollectionCardDto => ({
  id: name,
  name,
  number,
  imageThumbUrl: null,
  realName: null,
  state: comicsRead >= 5 ? "COLLECTED" : "DISCOVERED",
  comicsRead,
  isFavorite,
  isNew: false,
});

// En orden de catálogo, como las deja toCollection.
const cards = [card("Spider-Man", 9, false, 1), card("Venom", 1, false, 2), card("Mary Jane", 7, true, 4)];
const names = (list: CollectionCardDto[]) => list.map((c) => c.name);

describe("filterCards", () => {
  it("filtra por favoritos, descubiertos y coleccionados", () => {
    expect(names(filterCards(cards, { filter: "favorites", sort: "name" }))).toEqual(["Mary Jane"]);
    expect(names(filterCards(cards, { filter: "discovered", sort: "name" }))).toEqual(["Venom"]);
    expect(names(filterCards(cards, { filter: "collected", sort: "name" }))).toEqual([
      "Mary Jane",
      "Spider-Man",
    ]);
  });

  it("ordena por cómics leídos de más a menos", () => {
    expect(names(filterCards(cards, { filter: "all", sort: "comics" }))).toEqual([
      "Spider-Man",
      "Mary Jane",
      "Venom",
    ]);
  });
});

describe("filterCards por número", () => {
  it("mantiene el orden de catálogo y ordena por nombre si se pide", () => {
    expect(names(filterCards(cards, { filter: "all", sort: "number" }))).toEqual([
      "Spider-Man",
      "Venom",
      "Mary Jane",
    ]);
    expect(names(filterCards(cards, { filter: "all", sort: "name" }))).toEqual([
      "Mary Jane",
      "Spider-Man",
      "Venom",
    ]);
  });
});

describe("collectionSearchSchema y favoriteSchema", () => {
  it("aplica valores por defecto y rechaza valores desconocidos", () => {
    expect(collectionSearchSchema.parse({})).toEqual({ filter: "all", sort: "number" });
    expect(collectionSearchSchema.safeParse({ filter: "locked" }).success).toBe(false);
  });

  it("exige un booleano real para el favorito", () => {
    expect(favoriteSchema.safeParse({ isFavorite: true }).success).toBe(true);
    expect(favoriteSchema.safeParse({ isFavorite: "true" }).success).toBe(false);
  });
});
