import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { findUnlockedCharacters } from "@/server/repositories/characters";
import {
  CharacterNotFoundError,
  getCharacterDetail,
  getCollection,
  setCharacterFavorite,
} from "@/server/services/discovery";
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

describe("getCollection", () => {
  it("cuenta los cómics leídos por personaje y oculta los bloqueados", async () => {
    const { user, comicA, comicB } = await seed();
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicB.id, "PENDING");

    const collection = await getCollection(db, user.id);

    expect(collection.cards.map((c) => [c.name, c.comicsRead])).toEqual([
      ["Spider-Man", 1],
      ["Venom", 1],
    ]);
    expect(collection.locked).toBe(1);
    expect(JSON.stringify(collection)).not.toContain("Green Goblin");
  });
});

describe("getCharacterDetail", () => {
  async function seedWithIds() {
    const user = await createUser(db);
    const spiderMan = await createCharacter(db, "Spider-Man");
    const goblin = await createCharacter(db, "Green Goblin");
    const comicA = await createComic(db, [spiderMan]);
    const comicB = await createComic(db, [spiderMan, goblin]);
    return { user, spiderMan, goblin, comicA, comicB };
  }

  it("devuelve null para un personaje bloqueado aunque el cómic esté en la biblioteca", async () => {
    const { user, goblin, comicB } = await seedWithIds();
    await setComicStatus(db, user.id, comicB.id, "PENDING");

    expect(await getCharacterDetail(db, user.id, goblin.id)).toBeNull();
  });

  it("devuelve null para un personaje no coleccionable o inexistente", async () => {
    const { user } = await seedWithIds();
    const extra = await createCharacter(db, "Transeúnte", { isCollectible: false });
    const comic = await createComic(db, [extra]);
    await setComicStatus(db, user.id, comic.id, "READ");

    expect(await getCharacterDetail(db, user.id, extra.id)).toBeNull();
    expect(
      await getCharacterDetail(db, user.id, "00000000-0000-4000-8000-000000000000"),
    ).toBeNull();
  });

  it("lista solo los cómics de MI biblioteca con mi estado", async () => {
    const { user, spiderMan, comicA, comicB } = await seedWithIds();
    const other = await createUser(db);
    const comicC = await createComic(db, [spiderMan]);
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, user.id, comicB.id, "READING");
    await setComicStatus(db, other.id, comicC.id, "READ");

    const detail = await getCharacterDetail(db, user.id, spiderMan.id);

    expect(detail?.comicsRead).toBe(1);
    expect(detail?.state).toBe("DISCOVERED");
    expect(detail?.comics.map((c) => [c.comic.id, c.status]).sort()).toEqual(
      [
        [comicA.id, "READ"],
        [comicB.id, "READING"],
      ].sort(),
    );
  });

  it("enlaza la primera aparición si ese cómic está importado", async () => {
    const { user, spiderMan, comicA } = await seedWithIds();
    await db.character.update({
      where: { id: spiderMan.id },
      data: { firstAppearanceExternalId: comicA.externalId },
    });
    await setComicStatus(db, user.id, comicA.id, "READ");

    const detail = await getCharacterDetail(db, user.id, spiderMan.id);

    expect(detail?.firstAppearance).toEqual({ id: comicA.id, title: comicA.title });
  });
});

describe("relaciones", () => {
  // Spider-Man y Venom salen juntos en 5 cómics; además hay uno solo de Spider-Man.
  async function seedRelated() {
    const user = await createUser(db);
    const spiderMan = await createCharacter(db, "Spider-Man");
    const venom = await createCharacter(db, "Venom");
    const together = [];
    for (let i = 0; i < 5; i++) together.push(await createComic(db, [spiderMan, venom]));
    const soloSpidey = await createComic(db, [spiderMan]);
    return { user, spiderMan, venom, together, soloSpidey };
  }

  it("solo se revela cuando los dos personajes están desbloqueados", async () => {
    const { user, spiderMan, venom, together, soloSpidey } = await seedRelated();

    // Solo Spider-Man: la relación existe pero sigue oculta (solo el número).
    await setComicStatus(db, user.id, soloSpidey.id, "READ");
    const before = await getCharacterDetail(db, user.id, spiderMan.id);
    expect(before?.relationships).toEqual([]);
    expect(before?.hiddenRelationships).toBe(1);
    expect(JSON.stringify(before)).not.toContain("Venom");
    expect((await getCollection(db, user.id)).relationships).toEqual({ discovered: 0, total: 1 });

    // Al desbloquear Venom, se descubre.
    const result = await setComicStatus(db, user.id, together[0].id, "READ");
    expect(result.unlock?.newRelationships).toBe(1);

    const after = await getCharacterDetail(db, user.id, spiderMan.id);
    expect(after?.relationships).toEqual([
      {
        character: expect.objectContaining({ id: venom.id, name: "Venom" }),
        shared: 5,
        type: null,
      },
    ]);
    expect(after?.hiddenRelationships).toBe(0);
    expect((await getCollection(db, user.id)).relationships).toEqual({ discovered: 1, total: 1 });
  });

  it("al volver a bloquear un personaje la relación deja de estar descubierta", async () => {
    const { user, together, soloSpidey } = await seedRelated();
    await setComicStatus(db, user.id, soloSpidey.id, "READ");
    await setComicStatus(db, user.id, together[0].id, "READ");

    const dropped = await setComicStatus(db, user.id, together[0].id, "DROPPED");

    expect(dropped.unlock?.newRelationships).toBe(0);
    expect((await getCollection(db, user.id)).relationships.discovered).toBe(0);
  });
});

describe("personajes favoritos", () => {
  it("solo se pueden marcar personajes desbloqueados", async () => {
    const user = await createUser(db);
    const spiderMan = await createCharacter(db, "Spider-Man");
    const venom = await createCharacter(db, "Venom");
    const comic = await createComic(db, [spiderMan]);
    await createComic(db, [venom]);
    await setComicStatus(db, user.id, comic.id, "READ");

    await expect(setCharacterFavorite(db, user.id, venom.id, true)).rejects.toThrow(
      CharacterNotFoundError,
    );
    expect(await setCharacterFavorite(db, user.id, spiderMan.id, true)).toEqual({ isFavorite: true });
  });

  it("marcar dos veces no duplica y desmarcar lo quita", async () => {
    const user = await createUser(db);
    const spiderMan = await createCharacter(db, "Spider-Man");
    const comic = await createComic(db, [spiderMan]);
    await setComicStatus(db, user.id, comic.id, "READ");

    await setCharacterFavorite(db, user.id, spiderMan.id, true);
    await setCharacterFavorite(db, user.id, spiderMan.id, true);
    expect(await db.characterFavorite.count()).toBe(1);
    expect((await getCharacterDetail(db, user.id, spiderMan.id))?.isFavorite).toBe(true);

    await setCharacterFavorite(db, user.id, spiderMan.id, false);
    expect(await db.characterFavorite.count()).toBe(0);
  });

  it("la colección filtra por favoritos y los favoritos son de cada usuario", async () => {
    const { user, comicA } = await seed();
    const other = await createUser(db);
    await setComicStatus(db, user.id, comicA.id, "READ");
    await setComicStatus(db, other.id, comicA.id, "READ");
    const spiderMan = (await getCollection(db, user.id)).cards.find((c) => c.name === "Spider-Man")!;
    await setCharacterFavorite(db, user.id, spiderMan.id, true);

    const mine = await getCollection(db, user.id, { filter: "favorites", sort: "name" });
    expect(mine.cards.map((c) => c.name)).toEqual(["Spider-Man"]);
    expect(mine.locked).toBe(0);
    expect(mine.counts).toMatchObject({ all: 3, favorites: 1, discovered: 2 });

    const theirs = await getCollection(db, other.id, { filter: "favorites", sort: "name" });
    expect(theirs.cards).toEqual([]);
  });
});
