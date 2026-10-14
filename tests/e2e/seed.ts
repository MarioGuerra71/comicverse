import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { e2eDatabaseUrl, SEED } from "./db";

/**
 * Prepara la BD de los E2E: aplica las migraciones, la vacía y crea un cómic de cada editorial
 * con sus personajes. Se ejecuta antes de arrancar la app (ver playwright.config.ts).
 */
async function seed() {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: e2eDatabaseUrl },
    stdio: "inherit",
  });

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: e2eDatabaseUrl }) });
  try {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);

    const comics = [
      { slug: "marvel", publisher: "Marvel", title: SEED.marvelComic, characters: SEED.marvelCharacters },
      { slug: "dc-comics", publisher: "DC Comics", title: SEED.dcComic, characters: ["Bruce Prueba"] },
    ];
    let marvel: { publisherId: string; seriesId: string } | null = null;
    for (const [i, c] of comics.entries()) {
      const publisher = await db.publisher.create({ data: { name: c.publisher, slug: c.slug } });
      const series = await db.series.create({
        data: { publisherId: publisher.id, name: c.title.replace(/ #1$/, ""), startYear: 2020, source: "COMICVINE", externalId: `e2e-series-${i}` },
      });
      if (c.slug === "marvel") marvel = { publisherId: publisher.id, seriesId: series.id };
      await db.comic.create({
        data: {
          seriesId: series.id,
          issueNumber: "1",
          title: c.title,
          description: "Un cómic de prueba.",
          releaseDate: new Date("2020-01-01T00:00:00Z"),
          source: "COMICVINE",
          externalId: `e2e-comic-${i}`,
          // Ya sincronizado: abrirlo no llama a Comic Vine.
          charactersSyncedAt: new Date(),
          characters: {
            create: c.characters.map((name, j) => ({
              character: {
                create: { name, publisherId: publisher.id, isCollectible: true, source: "COMICVINE", externalId: `e2e-char-${i}-${j}` },
              },
            })),
          },
        },
      });
    }

    // Más números de la serie de Marvel, un mes después cada uno.
    for (const [j, later] of SEED.marvelLater.entries()) {
      await db.comic.create({
        data: {
          seriesId: marvel!.seriesId,
          issueNumber: String(j + 2),
          title: later.title,
          releaseDate: new Date(Date.UTC(2020, j + 1, 1)),
          source: "COMICVINE",
          externalId: `e2e-comic-later-${j}`,
          charactersSyncedAt: new Date(),
          characters: {
            create: [
              {
                character: {
                  create: { name: later.character, publisherId: marvel!.publisherId, isCollectible: true, source: "COMICVINE", externalId: `e2e-char-later-${j}` },
                },
              },
            ],
          },
        },
      });
    }
  } finally {
    await db.$disconnect();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
