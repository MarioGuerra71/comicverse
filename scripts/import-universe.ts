import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import {
  importUniverse,
  type UniverseFile,
} from "@/server/jobs/import-universe";

async function main() {
  const apiKey = process.env.COMIC_VINE_API_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  if (!apiKey || !databaseUrl) {
    console.error(
      "Faltan COMIC_VINE_API_KEY o DATABASE_URL. Ejecuta el script con: npm run universe:import",
    );
    process.exit(1);
  }

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const universe = JSON.parse(
      await readFile("data/universe.json", "utf8"),
    ) as UniverseFile;
    const client = new ComicVineClient({ apiKey });

    const started = Date.now();
    const summary = await importUniverse({ db, client, universe });
    const seconds = Math.round((Date.now() - started) / 1000);

    console.log("\nPersonajes y cuántos cómics de nuestro catálogo tienen:");
    console.table(summary.perCharacter);
    console.log(
      `\nListo en ${seconds}s: ${summary.series} series, ${summary.comics} cómics, ` +
        `${summary.characters} personajes, ${summary.links} enlaces.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});