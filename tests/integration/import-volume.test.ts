import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import { importVolume } from "@/server/jobs/import-volume";
import { createTestDb, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const ok = (results: unknown, total = 1, pageResults = 1) =>
  new Response(
    JSON.stringify({
      error: "OK",
      status_code: 1,
      limit: 100,
      offset: 0,
      number_of_page_results: pageResults,
      number_of_total_results: total,
      results,
    }),
  );

const issue = (id: number) => ({
  id,
  name: null,
  issue_number: String(id),
  cover_date: "2025-01-01",
  store_date: null,
  image: null,
  description: "<p>Hola</p>",
});

/** Comic Vine falso: una serie de DC con 3 cómics repartidos en dos páginas (2 + 1). */
function fakeClient() {
  const fetchFn = async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname.includes("/volume/4050-163145")) {
      return ok({ id: 163145, name: "Absolute Green Lantern", start_year: "2025", publisher: { id: 10, name: "DC Comics" } });
    }
    const offset = Number(url.searchParams.get("offset"));
    return offset === 0 ? ok([issue(1), issue(2)], 3, 2) : ok([issue(3)], 3, 1);
  };
  return new ComicVineClient({ apiKey: "k", fetchFn: fetchFn as typeof fetch, sleep: async () => {} });
}

describe("importVolume", () => {
  it("crea la editorial, la serie y todos sus cómics, y repetirlo no duplica", async () => {
    const first = await importVolume(db, fakeClient(), 163145);
    expect(first).toMatchObject({ label: "Absolute Green Lantern (2025)", comics: 3 });

    await importVolume(db, fakeClient(), 163145);
    const comics = await db.comic.findMany({
      where: { seriesId: first.seriesId },
      orderBy: { externalId: "asc" },
      select: { title: true, description: true },
    });
    expect(comics.map((c) => c.title)).toEqual([
      "Absolute Green Lantern #1",
      "Absolute Green Lantern #2",
      "Absolute Green Lantern #3",
    ]);
    expect(comics[0].description).toBe("Hola");
    expect(await db.publisher.findUnique({ where: { slug: "dc-comics" } })).not.toBeNull();
  });
});
