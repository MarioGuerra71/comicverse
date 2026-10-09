import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { importRelationships } from "@/server/jobs/import-relationships";

// Carga data/relationships.json en la base de datos. No llama a Comic Vine.
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Falta DATABASE_URL. Ejecuta el script con: npm run relationships:import");
    process.exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const file = JSON.parse(await readFile("data/relationships.json", "utf8"));
    const { imported, skipped } = await importRelationships(db, file);
    console.log(`Listo: ${imported} relaciones curadas importadas.`);
    if (skipped.length) {
      console.log(`Pendientes (algún personaje aún no está en la base de datos): ${skipped.join(", ")}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
