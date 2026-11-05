import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countCompletedSeries } from "@/server/repositories/achievements";
import { getDashboard, getNewIssues, getNextIssues, getReadingStats } from "@/server/services/dashboard";
import { listLibrarySeries, setComicStatus, updateLibraryEntry } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

/** Una serie de `n` números (todos van a la misma «Serie de prueba»). */
async function series(n: number, characters: { id: string }[] = []) {
  const comics = [];
  for (let i = 0; i < n; i++) comics.push(await createComic(db, characters));
  return comics;
}

describe("progreso por serie", () => {
  it("el siguiente número es el que va después del último leído", async () => {
    const user = await createUser(db);
    const [c1, c2, c3] = await series(4);
    await setComicStatus(db, user.id, c1.id, "READ");
    await setComicStatus(db, user.id, c2.id, "READ");

    const next = await getNextIssues(db, user.id, 6);
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ comic: { id: c3.id }, read: 2, total: 4 });
  });

  it("las carpetas cuentan sobre el total de la serie, no solo lo que tienes", async () => {
    const user = await createUser(db);
    const [c1] = await series(5);
    await setComicStatus(db, user.id, c1.id, "READ");

    const [folder] = await listLibrarySeries(db, user.id);
    expect(folder).toMatchObject({ read: 1, total: 5 });
  });

  it("una serie solo cuenta como completa con todos sus números leídos (y al menos 4)", async () => {
    const user = await createUser(db);
    const comics = await series(4);
    for (const c of comics.slice(0, 3)) await setComicStatus(db, user.id, c.id, "READ");
    expect(await countCompletedSeries(db, user.id)).toBe(0);

    await setComicStatus(db, user.id, comics[3].id, "READ");
    expect(await countCompletedSeries(db, user.id)).toBe(1);
    expect(await countCompletedSeries(db, user.id, "marvel")).toBe(1);
    expect(await countCompletedSeries(db, user.id, "dc")).toBe(0);
    expect(await getNextIssues(db, user.id, 6)).toEqual([]);
  });
});

describe("novedades y estadísticas", () => {
  it("avisa de los números recientes de tus series que aún no tienes", async () => {
    const user = await createUser(db);
    const [old, fresh, future] = await series(3);
    await setComicStatus(db, user.id, old.id, "READ");
    await db.comic.update({ where: { id: fresh.id }, data: { releaseDate: new Date(Date.now() - 5 * 86_400_000) } });
    await db.comic.update({ where: { id: future.id }, data: { releaseDate: new Date(Date.now() + 5 * 86_400_000) } });

    const groups = await getNewIssues(db, user.id);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ count: 1, latest: { id: fresh.id } });
    // La serie de prueba es de Marvel: en la zona DC no sale.
    expect(await getNewIssues(db, user.id, "marvel")).toHaveLength(1);
    expect(await getNewIssues(db, user.id, "dc")).toEqual([]);
  });

  it("el ranking ordena a los personajes por cómics leídos", async () => {
    const user = await createUser(db);
    const batman = await createCharacter(db, "Batman");
    const robin = await createCharacter(db, "Robin");
    const [a] = await series(1, [batman, robin]);
    const [b] = await series(1, [batman]);
    await setComicStatus(db, user.id, a.id, "READ");
    await setComicStatus(db, user.id, b.id, "READ");

    const stats = await getReadingStats(db, user.id);
    expect(stats.read).toBe(2);
    expect(stats.streak).toBe(1);
    expect(stats.topCharacters.map((c) => [c.name, c.comicsRead])).toEqual([
      ["Batman", 2],
      ["Robin", 1],
    ]);
  });
});

describe("Inicio: personaje del momento y series casi terminadas", () => {
  it("el personaje que más has leído este mes, solo de lo leído en los últimos 30 días", async () => {
    const user = await createUser(db);
    const batman = await createCharacter(db, "Batman");
    const robin = await createCharacter(db, "Robin");
    const [a, b, old] = await series(3, [batman]);
    await db.comicCharacter.create({ data: { comicId: old.id, characterId: robin.id } });
    await setComicStatus(db, user.id, a.id, "READ");
    await setComicStatus(db, user.id, b.id, "READ");
    // Leído hace dos meses: no cuenta para «este mes».
    await setComicStatus(db, user.id, old.id, "READ", new Date(Date.now() - 60 * 86_400_000));

    const { characterOfTheMonth } = await getDashboard(db, user.id);
    expect(characterOfTheMonth).toMatchObject({ name: "Batman", comics: 2 });
  });

  it("puntuar un cómic antiguo no lo convierte en el «último leído»", async () => {
    const user = await createUser(db);
    const [older, newer] = await series(2);
    await setComicStatus(db, user.id, older.id, "READ", new Date(Date.now() - 2 * 86_400_000));
    await setComicStatus(db, user.id, newer.id, "READ");
    await updateLibraryEntry(db, user.id, older.id, { rating: 5 });

    expect((await getDashboard(db, user.id)).hero?.comic.id).toBe(newer.id);
  });

  it("si se marcaron varios a la vez, el «último leído» es el que salió más tarde", async () => {
    const user = await createUser(db);
    const [first, second] = await series(2);
    await db.comic.update({ where: { id: first.id }, data: { releaseDate: new Date("2020-01-01") } });
    await db.comic.update({ where: { id: second.id }, data: { releaseDate: new Date("2020-02-01") } });
    const at = new Date();
    await setComicStatus(db, user.id, second.id, "READ", at);
    await setComicStatus(db, user.id, first.id, "READ", at);
    await updateLibraryEntry(db, user.id, first.id, { rating: 4 });

    expect((await getDashboard(db, user.id)).hero?.comic.id).toBe(second.id);
  });

  it("las series empezadas a las que les faltan pocos números", async () => {
    const user = await createUser(db);
    const comics = await series(4);
    for (const c of comics.slice(0, 3)) await setComicStatus(db, user.id, c.id, "PENDING");
    await setComicStatus(db, user.id, comics[0].id, "READ");

    // La única serie es la de la caja de luz: no se repite.
    expect((await getDashboard(db, user.id)).almostDone).toEqual([]);
  });
});
