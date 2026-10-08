import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { listSeries, searchComics } from "@/server/services/catalog";
import { comicSearchSchema } from "@/server/validation/catalog";
import { createComic, createTestDb, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

async function createDcComic() {
  const publisher = await db.publisher.create({ data: { name: "DC Comics", slug: "dc-comics" } });
  const series = await db.series.create({
    data: { publisherId: publisher.id, name: "Absolute Batman", source: "COMICVINE", externalId: "dc-1" },
  });
  return db.comic.create({
    data: { seriesId: series.id, issueNumber: "1", title: "Absolute Batman #1", source: "COMICVINE", externalId: "dc-c1" },
  });
}

describe("catálogo por zonas", () => {
  it("cada zona solo ve los cómics y las series de su editorial", async () => {
    const marvel = await createComic(db);
    const dc = await createDcComic();
    const search = (publisher?: "marvel" | "dc") =>
      searchComics(db, comicSearchSchema.parse({ publisher }));

    expect((await search("marvel")).items.map((c) => c.id)).toEqual([marvel.id]);
    expect((await search("dc")).items.map((c) => c.id)).toEqual([dc.id]);
    expect((await search()).total).toBe(2);

    expect((await listSeries(db, "dc")).map((s) => s.name)).toEqual(["Absolute Batman"]);
    expect((await listSeries(db, "marvel")).map((s) => s.name)).toEqual(["Serie de prueba"]);
  });
});
