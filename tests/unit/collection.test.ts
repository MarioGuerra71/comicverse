import { describe, expect, it } from "vitest";
import { filterCards, type CollectionCardDto } from "@/server/dto/character";
import { collectionSearchSchema, favoriteSchema } from "@/server/validation/collection";

const card = (name: string, comicsRead: number, isFavorite = false): CollectionCardDto => ({
  id: name,
  name,
  imageThumbUrl: null,
  realName: null,
  state: comicsRead >= 5 ? "COLLECTED" : "DISCOVERED",
  comicsRead,
  isFavorite,
});

const cards = [card("Mary Jane", 7, true), card("Spider-Man", 9), card("Venom", 1)];
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

describe("collectionSearchSchema y favoriteSchema", () => {
  it("aplica valores por defecto y rechaza valores desconocidos", () => {
    expect(collectionSearchSchema.parse({})).toEqual({ filter: "all", sort: "name" });
    expect(collectionSearchSchema.safeParse({ filter: "locked" }).success).toBe(false);
  });

  it("exige un booleano real para el favorito", () => {
    expect(favoriteSchema.safeParse({ isFavorite: true }).success).toBe(true);
    expect(favoriteSchema.safeParse({ isFavorite: "true" }).success).toBe(false);
  });
});
