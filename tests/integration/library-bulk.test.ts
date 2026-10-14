import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { ComicNotFoundError, findUnreadUpTo, setComicStatus, setComicsStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe("setComicsStatus (varios a la vez)", () => {
  it("marca un lote como leído, desbloquea una vez y atribuye cada personaje a su primer cómic", async () => {
    const user = await createUser(db);
    const peter = await createCharacter(db, "Peter");
    const mary = await createCharacter(db, "Mary");
    const harry = await createCharacter(db, "Harry");
    const a = await createComic(db, [peter, mary]);
    const b = await createComic(db, [mary, harry]);
    const c = await createComic(db, []);

    const result = await setComicsStatus(db, user.id, [a.id, b.id, c.id], "READ");

    expect(result.changed).toBe(3);
    expect(result.unlock?.newCharacters.map((ch) => ch.name).sort()).toEqual(["Harry", "Mary", "Peter"]);
    const discoveries = await db.discovery.findMany({ where: { userId: user.id }, select: { characterId: true, viaComicId: true } });
    expect(discoveries).toHaveLength(3);
    // Mary sale en los dos: cuenta para el primero de la lista.
    expect(discoveries.find((d) => d.characterId === mary.id)?.viaComicId).toBe(a.id);
    expect(await db.readingHistory.count({ where: { userId: user.id } })).toBe(3);
  });

  it("no toca los que ya estaban en ese estado", async () => {
    const user = await createUser(db);
    const a = await createComic(db);
    const b = await createComic(db);
    await setComicStatus(db, user.id, a.id, "READ");

    const result = await setComicsStatus(db, user.id, [a.id, b.id], "READ");
    expect(result.changed).toBe(1);
    expect(await db.readingHistory.count({ where: { userId: user.id, comicId: a.id } })).toBe(1);
  });

  it("si un cómic no existe no se guarda ninguno", async () => {
    const user = await createUser(db);
    const a = await createComic(db);
    await expect(setComicsStatus(db, user.id, [a.id, randomUUID()], "READ")).rejects.toBeInstanceOf(ComicNotFoundError);
    expect(await db.userComic.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe("findUnreadUpTo («hasta aquí»)", () => {
  it("devuelve los de la serie hasta ese cómic, sin los ya leídos", async () => {
    const user = await createUser(db);
    const [n1, n2, n3, n4] = [await createComic(db), await createComic(db), await createComic(db), await createComic(db)];
    await setComicStatus(db, user.id, n2.id, "READ");

    // createComic numera en orden de creación: n1 < n2 < n3 < n4.
    expect(await findUnreadUpTo(db, user.id, n3.id)).toEqual([n1.id, n3.id]);
    expect(await findUnreadUpTo(db, user.id, n4.id)).toEqual([n1.id, n3.id, n4.id]);
  });
});
