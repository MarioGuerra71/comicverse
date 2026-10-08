import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import { syncNewReleases } from "@/server/jobs/sync-new-releases";
import { createTestDb, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const ok = (results: unknown, total = 1) =>
  new Response(
    JSON.stringify({
      error: "OK",
      status_code: 1,
      number_of_page_results: Array.isArray(results) ? results.length : 1,
      number_of_total_results: Array.isArray(results) ? total : 1,
      results,
    }),
  );

const issue = (id: number, volume: number) => ({
  id,
  name: null,
  issue_number: String(id),
  cover_date: null,
  store_date: "2026-10-07",
  image: null,
  description: null,
  volume: { id: volume },
});

function fakeClient() {
  const calls: string[] = [];
  const fetchFn = async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    calls.push(url.pathname + "?" + (url.searchParams.get("filter") ?? ""));
    const filter = url.searchParams.get("filter") ?? "";
    if (filter.startsWith("store_date:")) {
      return ok([issue(1, 100), issue(2, 100), issue(10, 200), issue(20, 300)], 4);
    }
    // Las series desconocidas se piden todas juntas.
    if (filter === "id:200|300") {
      return ok(
        [
          { id: 200, name: "Nueva DC", start_year: "2026", publisher: { id: 10, name: "DC Comics" } },
          { id: 300, name: "Edición Panini", start_year: "2026", publisher: { id: 2338, name: "Panini España" } },
        ],
        2,
      );
    }
    if (filter === "volume:200") return ok([issue(10, 200), issue(11, 200)], 2);
    throw new Error(`petición inesperada ${url.pathname}`);
  };
  const client = new ComicVineClient({ apiKey: "k", fetchFn: fetchFn as typeof fetch, sleep: async () => {} });
  return { client, calls };
}

describe("syncNewReleases", () => {
  it("guarda las novedades de series conocidas, añade las nuevas de Marvel/DC e ignora el resto", async () => {
    const marvel = await db.publisher.create({ data: { name: "Marvel", slug: "marvel" } });
    const known = await db.series.create({
      data: { publisherId: marvel.id, name: "Midnight Spider-Man", source: "COMICVINE", externalId: "100" },
    });
    const { client, calls } = fakeClient();

    const summary = await syncNewReleases(db, client, { now: new Date("2026-10-08T06:00:00Z") });

    expect(calls[0]).toContain("store_date:2026-10-05|2026-10-08");
    expect(summary).toEqual({ issues: 4, comics: 4, newSeries: ["Nueva DC (2026)"] });
    expect(await db.comic.count({ where: { seriesId: known.id } })).toBe(2);
    expect(
      await db.comic.findMany({ where: { series: { externalId: "200" } }, select: { title: true }, orderBy: { title: "asc" } }),
    ).toEqual([{ title: "Nueva DC #10" }, { title: "Nueva DC #11" }]);
    expect(await db.series.findFirst({ where: { externalId: "300" } })).toBeNull();
  });
});
