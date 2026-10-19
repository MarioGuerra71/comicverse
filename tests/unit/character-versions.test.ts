import { describe, expect, it } from "vitest";
import { toCharacterVersions } from "@/server/dto/character";
import type { ComicListItemDto } from "@/server/dto/comic";
import { versionImageSchema } from "@/server/validation/collection";

const comic = (id: string, seriesId: string, cover: string | null): ComicListItemDto => ({
  id,
  title: id,
  storyTitle: null,
  releaseDate: null,
  coverThumbUrl: cover,
  series: { id: seriesId, name: seriesId === "abs" ? "Absolute Batman" : "Batman", startYear: 2024 },
  publisher: "DC Comics",
  characterCount: 1,
});

describe("toCharacterVersions", () => {
  it("crea una versión por serie leída, con sus portadas sin repetir y la imagen elegida", () => {
    const versions = toCharacterVersions(
      [
        { comic: comic("1", "bat", "c1"), status: "READ" },
        { comic: comic("2", "abs", "c2"), status: "READ" },
        { comic: comic("3", "abs", "c2"), status: "READ" },
        { comic: comic("4", "abs", "c4"), status: "READ" },
      ],
      [{ seriesId: "abs", imageUrl: "elegida" }],
    );
    expect(versions).toEqual([
      { seriesId: "bat", seriesTitle: "Batman (2024)", imageUrl: null, covers: ["c1"] },
      { seriesId: "abs", seriesTitle: "Absolute Batman (2024)", imageUrl: "elegida", covers: ["c2", "c4"] },
    ]);
  });

  it("ignora las series que aún no has leído (no hay versión que elegir)", () => {
    const versions = toCharacterVersions([{ comic: comic("1", "abs", "c1"), status: "PENDING" }], []);
    expect(versions).toEqual([]);
  });
});

describe("versionImageSchema", () => {
  const valid = (imageUrl: string) => versionImageSchema.safeParse({ imageUrl }).success;

  it("acepta cualquier imagen con HTTPS", () => {
    expect(valid("https://comicvine.gamespot.com/a/uploads/scale_small/batman.jpg")).toBe(true);
    expect(valid("https://i.pinimg.com/originals/ab/cd/absolute-batman.jpg")).toBe(true);
  });

  it("rechaza http, javascript:, data: y enlaces enormes", () => {
    expect(valid("http://example.com/x.jpg")).toBe(false);
    expect(valid("javascript:alert(1)")).toBe(false);
    expect(valid("data:image/png;base64,AAAA")).toBe(false);
    expect(valid(`https://example.com/${"a".repeat(2001)}`)).toBe(false);
  });
});
