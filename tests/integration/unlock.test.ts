import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { findUnlockedCharacters } from "@/server/repositories/characters";
import { removeFromLibrary, setComicStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

/** Universo mínimo: A = Spider-Man + Venom; B = Spider-Man + Green Goblin. */
async function seed() {
  const user = await createUser(db);
  const spiderMan = await createCharacter(db, "Spider-Man");
  const venom = await createCharacter(db, "Venom");
  const goblin = await createCharacter(db, "Green Goblin");
  const comicA = await createComic(db, [spiderMan, venom]);
  const comicB = await createComic(db, [spiderMan, goblin]);
  return { user, comicA, comicB };
}

const names = (list: { name: string }[] | undefined) =>
  (list ?? []).map((c) => c.name).sort();

async function unlockedNames(userId: string) {
  return names(await findUnlockedCharacters(db, userId));
}

describe("desbloqueo de personajes", () => {
  it("leer A desbloquea Spider-Man y Venom", async () => {
    const { user, comicA } = await seed();

    const result = await setComicStatus(db, user.id, comicA.id, "READ");

    expect(names(result.unlock?.newCharacters)).toEqual(["Spider-Man", "Venom"]);
    expect(result.unlock?.progress).toEqual({ unlocked: 2, total: 3 });
  });

  it("marcar Leído dos veces no desbloquea nada nuevo", async () => {
    const { user, comicA } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");

    const again = await setComicStatus(db, user.id, comicA.id, "READ");

    expect(again.changed).toBe(false);
    expect(again.unlock).toBeNull();
    expect(await unlockedNames(user.id)).toEqual(["Spider-Man", "Venom"]);
  });

  it("leer B después de A solo añade Green Goblin", async () => {
    const { user, comicA, comicB } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");

    const result = await setComicStatus(db, user.id, comicB.id, "READ");

    expect(names(result.unlock?.newCharacters)).toEqual(["Green Goblin"]);
    expect(result.unlock?.progress).toEqual({ unlocked: 3, total: 3 });
  });

  it("Pendiente y Leyendo no desbloquean", async () => {
    const { user, comicA, comicB } = await seed();

    expect((await setComicStatus(db, user.id, comicA.id, "PENDING")).unlock).toBeNull();
    expect((await setComicStatus(db, user.id, comicB.id, "READING")).unlock).toBeNull();
    expect(await unlockedNames(user.id)).toEqual([]);
  });

  it("desmarcar retira los no compartidos y conserva los compartidos", async () => {
    const { user, comicA, comicB } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicB.id, "READ");

    // B sale de Leído: Spider-Man sigue (está en A), Green Goblin se retira.
    const dropped = await setComicStatus(db, user.id, comicB.id, "DROPPED");
    expect(names(dropped.unlock?.lostCharacters)).toEqual(["Green Goblin"]);
    expect(dropped.unlock?.newCharacters).toEqual([]);

    // Quitar A de la biblioteca retira el resto.
    const removed = await removeFromLibrary(db, user.id, comicA.id);
    expect(names(removed.unlock?.lostCharacters)).toEqual(["Spider-Man", "Venom"]);
    expect(await unlockedNames(user.id)).toEqual([]);
  });

  it("releer un cómic tras desmarcarlo vuelve a desbloquear", async () => {
    const { user, comicA } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicA.id, "DROPPED");

    const reread = await setComicStatus(db, user.id, comicA.id, "READ");

    expect(names(reread.unlock?.newCharacters)).toEqual(["Spider-Man", "Venom"]);
  });

  it("un cómic sin personajes no desbloquea nada", async () => {
    const { user } = await seed();
    const empty = await createComic(db);

    const result = await setComicStatus(db, user.id, empty.id, "READ");

    expect(result.unlock?.newCharacters).toEqual([]);
    expect(result.unlock?.progress.unlocked).toBe(0);
  });

  it("los personajes no coleccionables ni se desbloquean ni cuentan en el total", async () => {
    const { user } = await seed();
    const extra = await createCharacter(db, "Transeúnte", { isCollectible: false });
    const comic = await createComic(db, [extra]);

    const result = await setComicStatus(db, user.id, comic.id, "READ");

    expect(result.unlock?.newCharacters).toEqual([]);
    expect(result.unlock?.progress.total).toBe(3);
  });

  it("las lecturas de otro usuario no desbloquean nada para mí", async () => {
    const { user, comicA } = await seed();
    const other = await createUser(db);
    await setComicStatus(db, other.id, comicA.id, "READ");

    expect(await unlockedNames(user.id)).toEqual([]);
    expect(await unlockedNames(other.id)).toEqual(["Spider-Man", "Venom"]);
  });

  it("peticiones simultáneas dejan el estado correcto", async () => {
    const { user, comicA, comicB } = await seed();

    await Promise.all([
      setComicStatus(db, user.id, comicA.id, "READ"),
      setComicStatus(db, user.id, comicB.id, "READ"),
      setComicStatus(db, user.id, comicA.id, "READ"),
    ]);

    expect(await unlockedNames(user.id)).toEqual(["Green Goblin", "Spider-Man", "Venom"]);
  });
});
