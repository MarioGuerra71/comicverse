import { describe, expect, it } from "vitest";
import { buildRelationshipSuggestions } from "@/server/integrations/comic-sources/comicvine/relationship-suggestions";

const character = (id: number, label: string, friends: number[] = [], enemies: number[] = []) => ({
  id,
  label,
  friends,
  enemies,
});

describe("buildRelationshipSuggestions", () => {
  it("une las dos direcciones en una sola pareja y descarta personajes de fuera", () => {
    const result = buildRelationshipSuggestions([
      character(1, "Spider-Man", [2, 999], [3]),
      character(2, "Mary Jane", [1]),
      character(3, "Green Goblin", [], [1]),
    ]);

    expect(result).toEqual([
      { a: { id: 1, label: "Spider-Man" }, b: { id: 3, label: "Green Goblin" }, type: "ENEMY" },
      { a: { id: 1, label: "Spider-Man" }, b: { id: 2, label: "Mary Jane" }, type: "ALLY" },
    ]);
  });

  it("marca CONFLICT si Comic Vine los da a la vez como aliados y enemigos", () => {
    const result = buildRelationshipSuggestions([
      character(1, "Spider-Man", [2]),
      character(2, "Venom", [], [1]),
    ]);

    expect(result.map((r) => r.type)).toEqual(["CONFLICT"]);
  });

  it("ignora que un personaje se cite a sí mismo", () => {
    expect(buildRelationshipSuggestions([character(1, "Spider-Man", [1], [1])])).toEqual([]);
  });
});
