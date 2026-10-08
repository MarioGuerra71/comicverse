// Ejecuta a mano la tarea de novedades (la misma que lanza Vercel Cron cada día).
// Uso: npm run releases:sync -- [días]
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { ComicVineClient } from "../src/server/integrations/comic-sources/comicvine/client";
import { syncNewReleases } from "../src/server/jobs/sync-new-releases";

async function main() {
  const { DATABASE_URL, COMIC_VINE_API_KEY } = process.env;
  if (!DATABASE_URL || !COMIC_VINE_API_KEY) {
    console.error("Faltan DATABASE_URL o COMIC_VINE_API_KEY. Ejecuta: npm run releases:sync");
    process.exit(1);
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
  const client = new ComicVineClient({ apiKey: COMIC_VINE_API_KEY });
  const started = Date.now();
  try {
    const summary = await syncNewReleases(db, client, { days: Number(process.argv[2] ?? 3) });
    console.log({ ...summary, segundos: Math.round((Date.now() - started) / 1000) });
  } finally {
    await db.$disconnect();
  }
}

main();
