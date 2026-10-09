import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { importRelationships } from "@/server/jobs/import-relationships";
import { getCharacterDetail } from "@/server/services/discovery";
import { setComicStatus } from "@/server/services/library";
import { createCharacter, createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

// Personajes con ids de Comic Vine conocidos, como en data/relationships.json.
async function seedCharacters() {
  const spiderMan = await createCharacter(db, "Spider-Man");
  const goblin = await createCharacter(db, "Green Goblin");
  await db.character.update({ where: { id: spiderMan.id }, data: { externalId: "1443" } });
  await db.character.update({ where: { id: goblin.id }, data: { externalId: "58812" } });
  return { spiderMan, goblin };
}

const file = (relationships: object[]) => ({ relationships });

describe("importRelationships", () => {
  it("importa con el id menor primero y es repetible", async () => {
    const { spiderMan, goblin } = await seedCharacters();
    const data = file([{ a: 1443, b: 58812, type: "ENEMY" }]);

    expect(await importRelationships(db, data)).toEqual({ imported: 1, skipped: [] });
    expect(await importRelationships(db, data)).toEqual({ imported: 1, skipped: [] });

    const rows = await db.characterRelationship.findMany();
    expect(rows).toHaveLength(1);
    expect([rows[0].characterAId, rows[0].characterBId]).toEqual(
      [spiderMan.id, goblin.id].sort(),
    );
  });

  it("salta ids desconocidos y rechaza tipos inválidos y parejas repetidas sin cambiar nada", async () => {
    await seedCharacters();
    await importRelationships(db, file([{ a: 1443, b: 58812, type: "ENEMY" }]));

    // Un personaje que aún no existe no es un error: esa pareja se salta y queda pendiente.
    expect(
      await importRelationships(db, file([{ a: 1443, b: 58812, type: "ENEMY" }, { a: 1443, b: 1, type: "ALLY", label: "pendiente" }])),
    ).toEqual({ imported: 1, skipped: ["pendiente"] });
    await expect(
      importRelationships(db, file([{ a: 1443, b: 58812, type: "AMIGOTE" }])),
    ).rejects.toThrow();
    await expect(
      importRelationships(
        db,
        file([
          { a: 1443, b: 58812, type: "ENEMY" },
          { a: 58812, b: 1443, type: "ALLY" },
        ]),
      ),
    ).rejects.toThrow(/repetida/);

    expect(await db.characterRelationship.findMany({ select: { type: true } })).toEqual([
      { type: "ENEMY" },
    ]);
  });

  it("la ficha muestra el tipo cuando los dos personajes están desbloqueados", async () => {
    const { spiderMan, goblin } = await seedCharacters();
    await importRelationships(db, file([{ a: 1443, b: 58812, type: "ENEMY" }]));
    const user = await createUser(db);
    const comic = await createComic(db, [spiderMan, goblin]); // solo 1 cómic juntos
    await setComicStatus(db, user.id, comic.id, "READ");

    const detail = await getCharacterDetail(db, user.id, spiderMan.id);

    expect(detail?.relationships).toEqual([
      { character: expect.objectContaining({ name: "Green Goblin" }), shared: 1, type: "ENEMY" },
    ]);
  });
});
