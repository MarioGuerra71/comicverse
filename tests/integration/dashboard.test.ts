import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getDashboard, getDashboardStats, getRecentDiscoveries } from "@/server/services/dashboard";
import { setComicStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

async function seed() {
  const user = await createUser(db);
  const spiderMan = await createCharacter(db, "Spider-Man");
  const venom = await createCharacter(db, "Venom");
  const comicA = await createComic(db, [spiderMan, venom]);
  const comicB = await createComic(db, [spiderMan]);
  return { user, spiderMan, venom, comicA, comicB };
}

const discoveries = (userId: string) =>
  db.discovery.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { characterId: true, viaComicId: true },
  });

describe("registro de descubrimientos", () => {
  it("apunta cada personaje nuevo con el cómic que lo desbloqueó", async () => {
    const { user, spiderMan, venom, comicA } = await seed();

    await setComicStatus(db, user.id, comicA.id, "READ");

    expect((await discoveries(user.id)).sort((a, b) => a.characterId.localeCompare(b.characterId))).toEqual(
      [
        { characterId: spiderMan.id, viaComicId: comicA.id },
        { characterId: venom.id, viaComicId: comicA.id },
      ].sort((a, b) => a.characterId.localeCompare(b.characterId)),
    );
  });

  it("no apunta nada si el cómic no trae personajes nuevos o no es Leído", async () => {
    const { user, comicA, comicB } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");

    await setComicStatus(db, user.id, comicB.id, "READ"); // Spider-Man ya estaba
    await setComicStatus(db, user.id, comicA.id, "READ"); // repetir: sin cambios

    expect(await discoveries(user.id)).toHaveLength(2);
  });

  it("es historia: desmarcar no borra, y redescubrir vuelve a apuntar", async () => {
    const { user, venom, comicA } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicA.id, "DROPPED");
    expect(await discoveries(user.id)).toHaveLength(2);

    await setComicStatus(db, user.id, comicA.id, "READ");
    const rows = await discoveries(user.id);
    expect(rows).toHaveLength(4);
    expect(rows.filter((r) => r.characterId === venom.id)).toHaveLength(2);
  });
});

describe("getDashboardStats", () => {
  it("resume biblioteca, personajes, relaciones y series", async () => {
    const { user, comicA, comicB } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicB.id, "READING");

    const stats = await getDashboardStats(db, user.id);

    expect(stats.library).toEqual({ PENDING: 0, READING: 1, READ: 1, DROPPED: 0, total: 2 });
    expect(stats.characters).toEqual({ unlocked: 2, total: 2 });
    expect(stats.series).toEqual({ discovered: 1, total: 1 });
    // Comparten un solo cómic: por debajo de los umbrales, no es relación.
    expect(stats.relationships).toEqual({ discovered: 0, total: 0 });
  });

  it("empieza a cero para un usuario nuevo", async () => {
    await seed();
    const fresh = await createUser(db);

    const stats = await getDashboardStats(db, fresh.id);

    expect(stats.library.total).toBe(0);
    expect(stats.characters.unlocked).toBe(0);
    expect(stats.series.discovered).toBe(0);
  });
});

describe("getRecentDiscoveries", () => {
  it("devuelve uno por personaje, el más reciente primero, con el cómic", async () => {
    const { user, comicA } = await seed();
    const goblin = await createCharacter(db, "Green Goblin");
    const comicC = await createComic(db, [goblin]);
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicC.id, "READ");

    const recent = await getRecentDiscoveries(db, user.id, 10);

    expect(recent[0]).toMatchObject({
      character: { name: "Green Goblin" },
      viaComic: { id: comicC.id, title: comicC.title },
    });
    expect(recent.map((d) => d.character.name).sort()).toEqual(["Green Goblin", "Spider-Man", "Venom"]);
    expect(await getRecentDiscoveries(db, user.id, 1)).toHaveLength(1);
  });

  it("no muestra personajes que han vuelto a bloquearse, aunque sigan en el registro", async () => {
    const { user, comicA, comicB } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ"); // Spider-Man + Venom
    await setComicStatus(db, user.id, comicB.id, "READ"); // Spider-Man (ya estaba)
    await setComicStatus(db, user.id, comicA.id, "DROPPED"); // Venom vuelve a bloquearse

    const recent = await getRecentDiscoveries(db, user.id, 10);

    expect(recent.map((d) => d.character.name)).toEqual(["Spider-Man"]);
    expect(JSON.stringify(await getDashboard(db, user.id))).not.toContain("Venom");
  });

  it("un redescubrimiento cuenta una sola vez", async () => {
    const { user, comicA } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicA.id, "DROPPED");
    await setComicStatus(db, user.id, comicA.id, "READ");

    expect(await getRecentDiscoveries(db, user.id, 10)).toHaveLength(2);
  });
});
