// Asigna nombre de usuario (a partir del nombre) a las cuentas que aún no tienen. Repetible.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { ensureHandle } from "@/server/services/social";

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const users = await db.user.findMany({ where: { handle: null }, select: { id: true } });
    for (const u of users) await ensureHandle(db, u.id);
    console.log(`Listo: ${users.length} nombres de usuario asignados.`);
  } finally {
    await db.$disconnect();
  }
}

main();
