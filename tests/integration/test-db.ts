import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

// Mismo contenedor de Docker que en desarrollo, otra base de datos.
export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://comicverse:comicverse_dev@localhost:5432/comicverse_test?schema=public";

// Los tests borran todas las tablas: nos negamos a tocar una BD que no sea de pruebas.
if (!new URL(testDatabaseUrl).pathname.endsWith("_test")) {
  throw new Error("La BD de los tests de integración debe terminar en _test");
}

export function createTestDb() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
  });
}

/** Vacía todas las tablas (menos el registro de migraciones de Prisma). */
export async function resetDb(db: PrismaClient) {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
}

let counter = 0;

export async function createUser(db: PrismaClient) {
  counter++;
  const now = new Date();
  return db.user.create({
    data: {
      id: `user-${counter}`,
      name: `Usuario ${counter}`,
      email: `user${counter}@test.local`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function createCharacter(
  db: PrismaClient,
  name: string,
  { isCollectible = true } = {},
) {
  counter++;
  return db.character.create({
    data: { name, isCollectible, source: "COMICVINE", externalId: `char-${counter}` },
  });
}

/** Crea un cómic; `characters` son los personajes que aparecen en él. */
export async function createComic(db: PrismaClient, characters: { id: string }[] = []) {
  counter++;
  const publisher = await db.publisher.upsert({
    where: { slug: "marvel" },
    create: { name: "Marvel", slug: "marvel" },
    update: {},
  });
  const series = await db.series.upsert({
    where: { source_externalId: { source: "COMICVINE", externalId: "series-test" } },
    create: {
      publisherId: publisher.id,
      name: "Serie de prueba",
      source: "COMICVINE",
      externalId: "series-test",
    },
    update: {},
  });
  return db.comic.create({
    data: {
      seriesId: series.id,
      issueNumber: String(counter),
      title: `Serie de prueba #${counter}`,
      source: "COMICVINE",
      externalId: `comic-${counter}`,
      characters: { create: characters.map((c) => ({ characterId: c.id })) },
    },
  });
}
