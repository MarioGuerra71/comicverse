import { describe, it, expect } from "vitest";
import {
  pickBestCharacter,
  type CharacterSearchResult,
} from "@/server/integrations/comic-sources/comicvine/character-matching";

const MARVEL = 31;

function character(
  id: number,
  name: string,
  appearances: number | null,
  publisher: { id: number; name: string } | null,
): CharacterSearchResult {
  return { id, name, count_of_issue_appearances: appearances, publisher };
}

const marvel = { id: MARVEL, name: "Marvel" };
const hasbro = { id: 99, name: "Hasbro" };

describe("pickBestCharacter", () => {
  it("ignora personajes de otras editoriales con el mismo nombre", () => {
    const results = [
      character(63504, "Venom", 22, hasbro),
      character(1486, "Venom", 3016, marvel),
    ];

    const match = pickBestCharacter(results, "Venom", MARVEL);

    expect(match.status).toBe("EXACT");
    expect(match.chosen?.id).toBe(1486);
  });

  it("prefiere el nombre exacto aunque otro resultado tenga más apariciones", () => {
    const results = [
      character(13380, "Mary Jane", 3983, marvel),
      character(1486, "Venom", 3016, marvel),
      character(6733, "Eddie Brock", 1188, marvel),
    ];

    const match = pickBestCharacter(results, "Eddie Brock", MARVEL);

    expect(match.chosen?.id).toBe(6733);
    expect(match.status).toBe("EXACT");
  });

  it("entre varios nombres exactos elige el más popular", () => {
    const results = [
      character(2, "Sandman", 10, marvel),
      character(1, "Sandman", 900, marvel),
    ];

    expect(pickBestCharacter(results, "Sandman", MARVEL).chosen?.id).toBe(1);
  });

  it("ignora mayúsculas y espacios al comparar nombres", () => {
    const results = [character(7, "Black Cat", 500, marvel)];

    const match = pickBestCharacter(results, "  black cat ", MARVEL);

    expect(match.status).toBe("EXACT");
  });

  it("marca FUZZY cuando no hay nombre exacto y usa el más popular", () => {
    const results = [
      character(1, "Ben Parker", 300, marvel),
      character(2, "Benjamin Grimm", 5000, marvel),
    ];

    const match = pickBestCharacter(results, "Uncle Ben", MARVEL);

    expect(match.status).toBe("FUZZY");
    expect(match.chosen?.id).toBe(2);
  });

  it("devuelve NOT_FOUND si no hay ningún personaje de la editorial", () => {
    const results = [character(63504, "Venom", 22, hasbro)];

    const match = pickBestCharacter(results, "Venom", MARVEL);

    expect(match.status).toBe("NOT_FOUND");
    expect(match.chosen).toBeNull();
  });

  it("tolera apariciones desconocidas (null)", () => {
    const results = [
      character(1, "Rhino", null, marvel),
      character(2, "Rhino", 400, marvel),
    ];

    expect(pickBestCharacter(results, "Rhino", MARVEL).chosen?.id).toBe(2);
  });
});