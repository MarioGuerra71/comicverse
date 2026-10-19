import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  CharacterNotFoundError,
  getAlbum,
  getCharacterDetail,
  setCharacterVersionImage,
} from "@/server/services/discovery";
import { setComicStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();
const IMAGE = "https://comicvine.gamespot.com/a/uploads/scale_small/absolute-batman.jpg";

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe("setCharacterVersionImage (versión de un personaje en una serie)", () => {
  it("solo se puede elegir si has leído un cómic de la serie en el que aparece", async () => {
    const user = await createUser(db);
    const batman = await createCharacter(db, "Batman");
    const comic = await createComic(db, [batman]);

    await setComicStatus(db, user.id, comic.id, "PENDING");
    await expect(setCharacterVersionImage(db, user.id, batman.id, comic.seriesId, IMAGE)).rejects.toThrow(
      CharacterNotFoundError,
    );

    await setComicStatus(db, user.id, comic.id, "READ");
    await setCharacterVersionImage(db, user.id, batman.id, comic.seriesId, IMAGE);

    const album = (await getAlbum(db, user.id, comic.seriesId))!.album;
    const slot = album.slots.find((s) => s.kind === "card");
    expect(slot?.kind === "card" && slot.card.imageThumbUrl).toBe(IMAGE);
    const detail = await getCharacterDetail(db, user.id, batman.id);
    expect(detail!.versions).toMatchObject([{ seriesId: comic.seriesId, imageUrl: IMAGE }]);
  });

  it("es solo tuya: otro usuario ve la imagen de siempre; con null se vuelve a la original", async () => {
    const [me, other] = [await createUser(db), await createUser(db)];
    const batman = await createCharacter(db, "Batman");
    const comic = await createComic(db, [batman]);
    await setComicStatus(db, me.id, comic.id, "READ");
    await setComicStatus(db, other.id, comic.id, "READ");

    await setCharacterVersionImage(db, me.id, batman.id, comic.seriesId, IMAGE);
    const otherAlbum = (await getAlbum(db, other.id, comic.seriesId))!.album;
    expect(JSON.stringify(otherAlbum)).not.toContain(IMAGE);

    await setCharacterVersionImage(db, me.id, batman.id, comic.seriesId, null);
    expect(await db.characterVersionImage.count()).toBe(0);
  });
});
