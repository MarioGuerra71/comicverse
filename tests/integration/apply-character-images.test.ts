import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { applyCharacterImages } from "@/server/jobs/apply-character-images";
import { createTestDb, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const venomUrl = "https://comicvine.gamespot.com/a/uploads/original/venom-clasico.jpg";

describe("applyCharacterImages", () => {
  it("pone la imagen elegida a mano", async () => {
    await db.character.create({ data: { name: "Venom", source: "COMICVINE", externalId: "1486", imageUrl: "otra" } });
    expect(await applyCharacterImages(db, { images: [{ comicVineId: 1486, imageUrl: venomUrl }] })).toBe(1);
    expect(await db.character.findFirst({ select: { imageUrl: true, imageThumbUrl: true } })).toEqual({
      imageUrl: venomUrl,
      imageThumbUrl: venomUrl,
    });
  });

  it("todo o nada: un id desconocido no cambia ninguna imagen", async () => {
    await db.character.create({ data: { name: "Venom", source: "COMICVINE", externalId: "1486", imageUrl: "otra" } });
    await expect(
      applyCharacterImages(db, {
        images: [
          { comicVineId: 1486, imageUrl: venomUrl },
          { comicVineId: 999999, imageUrl: venomUrl },
        ],
      }),
    ).rejects.toThrow("999999");
    expect((await db.character.findFirst())?.imageUrl).toBe("otra");
  });

  it("rechaza imágenes de otras webs (la CSP no las dejaría ver)", async () => {
    await expect(
      applyCharacterImages(db, { images: [{ comicVineId: 1486, imageUrl: "https://example.com/v.jpg" }] }),
    ).rejects.toThrow("comicvine");
  });
});
