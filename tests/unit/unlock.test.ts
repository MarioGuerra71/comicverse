import { describe, expect, it } from "vitest";
import { diffById } from "@/server/domain/unlock";
import { toCharacterSummary } from "@/server/dto/character";

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
