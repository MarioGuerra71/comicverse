import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getGraph, getZoneCollection } from "@/server/services/discovery";
import { getDashboard } from "@/server/services/dashboard";
import { setComicStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe("getZoneCollection (álbumes por serie)", () => {
  it("la serie de un cómic de la biblioteca es un álbum; leerlo entinta sus cromos", async () => {
    const user = await createUser(db);
    const spiderMan = await createCharacter(db, "Spider-Man");
    const venom = await createCharacter(db, "Venom");
    const comic = await createComic(db, [spiderMan, venom]);

    await setComicStatus(db, user.id, comic.id, "PENDING");
    let marvel = await getZoneCollection(db, user.id, "marvel");
    expect(marvel.progress).toEqual({ unlocked: 0, total: 2 });
    expect(marvel.albums).toHaveLength(1);
    expect(marvel.albums[0].slots.every((s) => s.kind === "locked")).toBe(true);
    // Nada de un bloqueado sale del servidor salvo su número.
    expect(JSON.stringify(marvel.albums)).not.toContain("Venom");

    await setComicStatus(db, user.id, comic.id, "READ");
    marvel = await getZoneCollection(db, user.id, "marvel");
    expect(marvel.progress).toEqual({ unlocked: 2, total: 2 });
    expect(marvel.albums[0]).toMatchObject({ discovered: 2, total: 2 });

    const dc = await getZoneCollection(db, user.id, "dc");
    expect(dc.albums).toEqual([]);
    expect(dc.progress).toEqual({ unlocked: 0, total: 0 });
  });

  it("Inicio y Universo solo cuentan lo de su zona", async () => {
    const user = await createUser(db);
    const hal = await createCharacter(db, "Hal Jordan");
    const publisher = await db.publisher.create({ data: { name: "DC Comics", slug: "dc-comics" } });
    const series = await db.series.create({
      data: { publisherId: publisher.id, name: "Absolute Green Lantern", source: "COMICVINE", externalId: "dc-s" },
    });
    const dcComic = await db.comic.create({
      data: {
        seriesId: series.id,
        title: "Absolute Green Lantern #1",
        source: "COMICVINE",
        externalId: "dc-c",
        characters: { create: [{ characterId: hal.id }] },
      },
    });
    await setComicStatus(db, user.id, dcComic.id, "READ");

    const dc = await getDashboard(db, user.id, "dc");
    expect(dc.stats.characters).toEqual({ unlocked: 1, total: 1 });
    expect(dc.stats.library.READ).toBe(1);
    expect(dc.recentDiscoveries.map((d) => d.character.name)).toEqual(["Hal Jordan"]);

    const marvel = await getDashboard(db, user.id, "marvel");
    expect(marvel.stats.characters).toEqual({ unlocked: 0, total: 0 });
    expect(marvel.stats.library.READ).toBe(0);
    expect(marvel.recentDiscoveries).toEqual([]);
    expect(marvel.activity).toEqual([]);

    expect((await getGraph(db, user.id, undefined, "dc"))!.nodes).toHaveLength(1);
    expect((await getGraph(db, user.id, undefined, "marvel"))!.nodes).toHaveLength(0);
  });
});
