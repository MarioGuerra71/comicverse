import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { matchReaderFiles, searchReaderCandidates } from "@/server/services/reader";
import { setComicStatus } from "@/server/services/library";
import { createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

describe("emparejar archivos del lector", () => {
  it("encuentra el cómic aunque el archivo use otro formato («serie de PRUEBA - 007»)", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);
    const name = `serie de PRUEBA - ${comic.issueNumber!.padStart(3, "0")}.cbr`;

    const [result] = await matchReaderFiles(db, user.id, [{ key: "a", name, path: "Mis cómics" }]);

    expect(result.match?.comicId).toBe(comic.id);
    expect(result.seriesKnown).toBe(true);
  });

  it("marca como «tuya» la serie de la que ya tienes cómics", async () => {
    const user = await createUser(db);
    const owned = await createComic(db);
    const other = await createComic(db);
    await setComicStatus(db, user.id, owned.id, "READ");

    const [result] = await matchReaderFiles(db, user.id, [{ key: "a", name: `Serie de prueba #${other.issueNumber}.cbz`, path: "" }]);
    expect(result.match).toMatchObject({ comicId: other.id, owned: true });
  });

  it("una serie que no está en el catálogo sale como desconocida", async () => {
    const user = await createUser(db);
    const [result] = await matchReaderFiles(db, user.id, [{ key: "a", name: "Absolute Evil 01.cbr", path: "" }]);
    expect(result).toMatchObject({ match: null, seriesKnown: false });
  });

  it("la búsqueda manual entiende «serie de prueba 2» sin la almohadilla", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);
    const candidates = await searchReaderCandidates(db, user.id, `serie de prueba ${comic.issueNumber}`);
    expect(candidates.map((c) => c.comicId)).toEqual([comic.id]);
  });
});
