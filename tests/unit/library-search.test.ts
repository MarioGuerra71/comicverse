import { describe, expect, it } from "vitest";
import { libraryTitleFilter } from "@/server/repositories/library";

describe("libraryTitleFilter", () => {
  it("«green lantern 21» busca «Green Lantern #» con el número 21 (no el #210)", () => {
    expect(libraryTitleFilter("green lantern 21")).toEqual({
      title: { contains: "green lantern #", mode: "insensitive" },
      issueNumber: "21",
    });
  });

  it("entiende la almohadilla y los ceros delante", () => {
    expect(libraryTitleFilter("Green Lantern #021")).toMatchObject({ issueNumber: "21" });
  });

  it("sin número, busca el texto tal cual", () => {
    expect(libraryTitleFilter("spider")).toEqual({ title: { contains: "spider", mode: "insensitive" } });
    expect(libraryTitleFilter("21")).toEqual({ title: { contains: "21", mode: "insensitive" } });
  });
});
