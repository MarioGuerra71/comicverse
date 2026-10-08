import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getZoneCollection } from "@/server/services/discovery";
import { setComicStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe("getZoneCollection (álbumes por serie)", () => {
  it("la serie de un cómic de la biblioteca es un álbum; leerlo entinta sus cromos", async () => {
    const user = await createUser(db);
    const spiderMan = await createCharacter(db, "Spider-Man");
    const venom = await createCharacter(db, "Venom");
    const comic = await createComic(db, [spiderMan, venom]);

    await setComicStatus(db, user.id, comic.id, "PENDING");
    let marvel = await getZoneCollection(db, user.id, "marvel");
    expect(marvel.progress).toEqual({ unlocked: 0, total: 2 });
    expect(marvel.albums).toHaveLength(1);
    expect(marvel.albums[0].slots.every((s) => s.kind === "locked")).toBe(true);
    // Nada de un bloqueado sale del servidor salvo su número.
    expect(JSON.stringify(marvel.albums)).not.toContain("Venom");

    await setComicStatus(db, user.id, comic.id, "READ");
    marvel = await getZoneCollection(db, user.id, "marvel");
    expect(marvel.progress).toEqual({ unlocked: 2, total: 2 });
    expect(marvel.albums[0]).toMatchObject({ discovered: 2, total: 2 });

    const dc = await getZoneCollection(db, user.id, "dc");
    expect(dc.albums).toEqual([]);
    expect(dc.progress).toEqual({ unlocked: 0, total: 0 });
  });
});
