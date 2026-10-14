import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { setComicStatus, writeReview } from "@/server/services/library";
import {
  follow,
  getPublicProfile,
  HandleTakenError,
  listCommunity,
  ProfileNotFoundError,
  ensureHandle,
  saveHandle,
  saveVisibility,
} from "@/server/services/social";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

async function seed() {
  const ana = await createUser(db);
  const bea = await createUser(db);
  const spiderMan = await createCharacter(db, "Spider-Man");
  const venom = await createCharacter(db, "Venom");
  const goblin = await createCharacter(db, "Green Goblin");
  const a = await createComic(db, [spiderMan, venom]);
  const b = await createComic(db, [spiderMan, goblin]);
  // Ana lee los dos; Bea solo el primero.
  await setComicStatus(db, ana.id, a.id, "READ");
  await setComicStatus(db, ana.id, b.id, "READ");
  await setComicStatus(db, bea.id, a.id, "READ");
  return { ana, bea, a, b };
}

describe("perfiles públicos", () => {
  it("si lo hace privado nadie más lo ve", async () => {
    const { ana, bea } = await seed();
    await saveHandle(db, ana.id, "ana");
    await saveVisibility(db, ana.id, false);
    expect(await getPublicProfile(db, bea.id, "ana")).toBeNull();
    // El dueño sí ve el suyo.
    expect((await getPublicProfile(db, ana.id, "ana"))?.isMe).toBe(true);
  });

  it("el nombre de usuario es único", async () => {
    const { ana, bea } = await seed();
    await saveHandle(db, ana.id, "ana");
    await expect(saveHandle(db, bea.id, "ana")).rejects.toBeInstanceOf(HandleTakenError);
  });

  it("la comparación da cifras y nunca dice quién te falta", async () => {
    const { ana, bea } = await seed();
    await saveHandle(db, ana.id, "ana");
    const profile = (await getPublicProfile(db, bea.id, "ana"))!;
    const [album] = profile.shelves.find((s) => s.zone === "marvel")!.albums;
    expect(album).toMatchObject({ total: 3, theirs: 3, mine: 2, ahead: 1, behind: 0 });
    // Green Goblin: Ana lo tiene, Bea no. Su nombre no puede salir del servidor.
    expect(JSON.stringify(profile)).not.toContain("Green Goblin");
  });

  it("solo se ven las reseñas marcadas como públicas", async () => {
    const { ana, bea, a, b } = await seed();
    await saveHandle(db, ana.id, "ana");
    await writeReview(db, ana.id, a.id, "Pública", true);
    await writeReview(db, ana.id, b.id, "Privada", false);
    const profile = (await getPublicProfile(db, bea.id, "ana"))!;
    expect(profile.reviews.map((r) => r.body)).toEqual(["Pública"]);
  });

  it("solo se puede seguir a perfiles públicos y aparecen en la comunidad", async () => {
    const { ana, bea } = await seed();
    await saveHandle(db, ana.id, "ana");
    await saveVisibility(db, ana.id, false);
    await expect(follow(db, bea.id, "ana")).rejects.toBeInstanceOf(ProfileNotFoundError);

    await saveVisibility(db, ana.id, true);
    await follow(db, bea.id, "ana");
    await follow(db, bea.id, "ana");
    const community = await listCommunity(db, bea.id);
    expect(community.following.map((u) => u.handle)).toEqual(["ana"]);
    expect(community.profiles.map((u) => u.handle)).toEqual(["ana"]);
    expect((await getPublicProfile(db, bea.id, "ana"))?.isFollowing).toBe(true);
    await expect(follow(db, ana.id, "ana")).rejects.toBeInstanceOf(ProfileNotFoundError);
  });

  it("el perfil es público por defecto y el nombre de usuario sale del nombre, sin repetirse", async () => {
    const ana = await createUser(db);
    const bea = await createUser(db);
    await db.user.updateMany({ where: { id: { in: [ana.id, bea.id] } }, data: { name: "María López" } });
    expect(await ensureHandle(db, ana.id)).toBe("maria-lopez");
    expect(await ensureHandle(db, bea.id)).toBe("maria-lopez-2");
    // Repetirlo no cambia el que ya tiene.
    expect(await ensureHandle(db, ana.id)).toBe("maria-lopez");
    expect((await getPublicProfile(db, bea.id, "maria-lopez"))?.user.isPublic).toBe(true);
  });
});
