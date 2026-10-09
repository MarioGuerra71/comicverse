import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getAchievementsPage, syncAchievements } from "@/server/services/achievements";
import { removeFromLibrary, setComicStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe("logros", () => {
  it("al leer se consiguen los que tocan, una sola vez, y no se pierden al desmarcar", async () => {
    const user = await createUser(db);
    const comic = await createComic(db, [await createCharacter(db, "Spider-Man")]);

    await setComicStatus(db, user.id, comic.id, "READ");
    const fresh = (await syncAchievements(db, user.id)).map((a) => a.id);
    expect(fresh).toEqual(expect.arrayContaining(["read-1", "unlock-1", "marvel-1"]));
    expect(fresh).not.toContain("read-10");
    expect(await syncAchievements(db, user.id)).toEqual([]);

    await removeFromLibrary(db, user.id, comic.id);
    const page = await getAchievementsPage(db, user.id);
    expect(page.items.find((i) => i.id === "read-1")?.earnedAt).not.toBeNull();
    expect(page.earned).toBe(fresh.length);
  });

  it("un logro secreto sin conseguir no revela su nombre ni su progreso", async () => {
    const user = await createUser(db);
    const { items } = await getAchievementsPage(db, user.id);
    const secret = items.find((i) => i.id === "decades-5")!;
    expect(secret).toMatchObject({ title: "???", description: null, current: null, target: null });
    expect(JSON.stringify(items)).not.toContain("Viajero en el tiempo");
  });
});
