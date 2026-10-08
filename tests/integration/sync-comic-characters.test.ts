import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import { ensureCharacterDetails, ensureComicCharacters } from "@/server/jobs/sync-comic-characters";
import { createComic, createTestDb, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

/** Comic Vine falso que cuenta las peticiones; `fail` simula que no responde. */
function fakeClient({ fail = false } = {}) {
  const calls = { count: 0 };
  const fetchFn = async () => {
    calls.count++;
    if (fail) return new Response("", { status: 500 });
    return new Response(
      JSON.stringify({
        error: "OK",
        status_code: 1,
        results: { character_credits: [{ id: 900, name: " Hal Jordan " }, { id: 901, name: "Sinestro" }] },
      }),
    );
  };
  const client = new ComicVineClient({
    apiKey: "k",
    fetchFn: fetchFn as typeof fetch,
    sleep: async () => {},
    maxRetries: 0,
  });
  return { client, calls };
}

describe("ensureComicCharacters", () => {
  it("crea y enlaza los personajes del cómic una sola vez", async () => {
    const comic = await createComic(db);
    await db.character.create({ data: { name: "Hal Jordan", source: "COMICVINE", externalId: "900", isCollectible: true } });
    const { client, calls } = fakeClient();

    await ensureComicCharacters(db, client, comic.id);
    await ensureComicCharacters(db, client, comic.id);

    expect(calls.count).toBe(1);
    const links = await db.comicCharacter.findMany({
      where: { comicId: comic.id },
      select: { character: { select: { name: true, isCollectible: true } } },
      orderBy: { character: { name: "asc" } },
    });
    // Hal Jordan ya existía (se reutiliza); Sinestro es nuevo. Los dos son coleccionables.
    expect(links.map((l) => l.character)).toEqual([
      { name: "Hal Jordan", isCollectible: true },
      { name: "Sinestro", isCollectible: true },
    ]);
    expect(await db.character.count()).toBe(2);
  });

  it("si Comic Vine falla no rompe nada y lo reintenta la próxima vez", async () => {
    const comic = await createComic(db);
    await ensureComicCharacters(db, fakeClient({ fail: true }).client, comic.id);
    expect((await db.comic.findUnique({ where: { id: comic.id } }))?.charactersSyncedAt).toBeNull();

    const { client, calls } = fakeClient();
    await ensureComicCharacters(db, client, comic.id);
    expect(calls.count).toBe(1);
    expect(await db.comicCharacter.count({ where: { comicId: comic.id } })).toBe(2);
  });

  it("sin clave de Comic Vine no hace nada", async () => {
    const comic = await createComic(db);
    await ensureComicCharacters(db, null, comic.id);
    expect(await db.comicCharacter.count()).toBe(0);
  });

  it("al leer, completa la ficha de los personajes que aún no la tienen", async () => {
    const comic = await createComic(db);
    await ensureComicCharacters(db, fakeClient().client, comic.id);

    const fetchFn = async (input: RequestInfo | URL) => {
      const id = Number(String(input).match(/character\/4005-(\d+)/)?.[1]);
      return new Response(
        JSON.stringify({
          error: "OK",
          status_code: 1,
          results: {
            id,
            name: id === 900 ? "Hal Jordan" : "Sinestro",
            real_name: id === 900 ? "Harold Jordan" : null,
            deck: "<b>Linterna</b>",
            publisher: { id: 10, name: "DC Comics" },
            image: { medium_url: `https://img/${id}.jpg`, thumb_url: `https://img/${id}-t.jpg` },
          },
        }),
      );
    };
    const client = new ComicVineClient({ apiKey: "k", fetchFn: fetchFn as typeof fetch, sleep: async () => {} });
    await ensureCharacterDetails(db, client, comic.id);

    const hal = await db.character.findFirstOrThrow({
      where: { externalId: "900" },
      include: { publisher: true },
    });
    expect(hal).toMatchObject({ realName: "Harold Jordan", summary: "Linterna" });
    expect(hal.publisher?.slug).toBe("dc-comics");
    expect(hal.detailsSyncedAt).not.toBeNull();
    expect(await db.character.count({ where: { detailsSyncedAt: null } })).toBe(0);
  });
});
