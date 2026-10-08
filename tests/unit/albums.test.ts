import { describe, expect, it } from "vitest";
import { toAlbums, type CollectionCardDto } from "@/server/dto/character";

const row = (seriesId: string, characterId: string | null, date: string | null) => ({
  seriesId,
  seriesName: seriesId === "s1" ? "Absolute Batman" : "Absolute Green Lantern",
  startYear: 2024,
  characterId,
  firstAppearance: date ? new Date(date) : null,
});

const card = (id: string): CollectionCardDto => ({
  id,
  name: id,
  imageThumbUrl: null,
  number: 99,
  realName: null,
  state: "DISCOVERED",
  comicsRead: 1,
  isFavorite: false,
  isNew: false,
});

describe("toAlbums", () => {
  const rows = [
    row("s1", "joker", "2024-12-01"),
    row("s1", "batman", "2024-10-01"),
    row("s1", "alfred", null),
    row("s2", null, null),
  ];
  const albums = toAlbums(rows, new Map([["batman", card("batman")]]));

  it("numera por primera aparición en la serie y pone la carta desbloqueada en su sitio", () => {
    const batman = albums.find((a) => a.seriesId === "s1")!;
    expect(batman).toMatchObject({ title: "Absolute Batman (2024)", discovered: 1, total: 3 });
    expect(batman.slots[0]).toMatchObject({ kind: "card", card: { id: "batman", number: 1 } });
    // Los bloqueados: solo su número dentro del álbum, sin id ni nombre.
    expect(batman.slots.slice(1)).toEqual([
      { kind: "locked", number: 2 },
      { kind: "locked", number: 3 },
    ]);
  });

  it("una serie sin personajes conocidos sale como álbum vacío", () => {
    expect(albums.find((a) => a.seriesId === "s2")).toMatchObject({ total: 0, slots: [] });
  });
});
