import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { DEMO_EMAIL_DOMAIN, DEMO_TTL_MS } from "@/lib/demo";
import { purgeExpiredDemos, seedDemoAccount } from "@/server/services/demo";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe("seedDemoAccount", () => {
  it("marca como leídos solo cómics con algún coleccionable con imagen y pone el perfil privado", async () => {
    const user = await createUser(db);
    const peter = await createCharacter(db, "Peter");
    const mary = await createCharacter(db, "Mary");
    const extra = await createCharacter(db, "Extra", { isCollectible: false });
    await db.character.updateMany({ where: { id: { in: [peter.id, extra.id] } }, data: { imageUrl: "https://example.com/x.jpg" } });
    const synced = await createComic(db, [peter, mary]);
    const noImage = await createComic(db, [mary, extra]);
    const pending = await createComic(db);

    await seedDemoAccount(db, user.id);

    const read = await db.userComic.findMany({ where: { userId: user.id, status: "READ" }, select: { comicId: true } });
    expect(read.map((r) => r.comicId)).toEqual([synced.id]);
    expect(read.map((r) => r.comicId)).not.toContain(pending.id);
    expect(read.map((r) => r.comicId)).not.toContain(noImage.id);
    expect(await db.discovery.count({ where: { userId: user.id } })).toBe(2);
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).isPublic).toBe(false);
  });
});

describe("purgeExpiredDemos", () => {
  it("borra solo las cuentas de demo de hace más de 24 h", async () => {
    const now = Date.now();
    const oldDemo = await createUser(db);
    const newDemo = await createUser(db);
    const oldReal = await createUser(db);
    await db.user.update({
      where: { id: oldDemo.id },
      data: { email: `a@${DEMO_EMAIL_DOMAIN}`, createdAt: new Date(now - DEMO_TTL_MS - 1000) },
    });
    await db.user.update({ where: { id: newDemo.id }, data: { email: `b@${DEMO_EMAIL_DOMAIN}` } });
    await db.user.update({ where: { id: oldReal.id }, data: { createdAt: new Date(now - DEMO_TTL_MS - 1000) } });

    await purgeExpiredDemos(db, now);

    const left = await db.user.findMany({ select: { id: true } });
    expect(left.map((u) => u.id).sort()).toEqual([newDemo.id, oldReal.id].sort());
  });
});
