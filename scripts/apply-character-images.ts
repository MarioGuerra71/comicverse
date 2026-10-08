import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { applyCharacterImages } from "@/server/jobs/apply-character-images";

// Aplica data/character-images.json (imágenes de personajes elegidas a mano). No llama a Comic Vine.
// Ejecutar después de universe:import, que vuelve a poner las imágenes de Comic Vine.
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Falta DATABASE_URL. Ejecuta el script con: npm run characters:images");
    process.exit(1);
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const file = JSON.parse(await readFile("data/character-images.json", "utf8"));
    console.log(`Listo: ${await applyCharacterImages(db, file)} imágenes aplicadas.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
