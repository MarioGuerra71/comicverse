import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { characterSummarySelect, unlockedBy } from "@/server/repositories/characters";

type Db = PrismaClient | Prisma.TransactionClient;

/** Apunta en el registro los personajes recién desbloqueados con un cómic. */
export function recordDiscoveries(
  db: Db,
  userId: string,
  viaComicId: string,
  characterIds: string[],
) {
  return db.discovery.createMany({
    data: characterIds.map((characterId) => ({ userId, characterId, viaComicId })),
  });
}

const discoverySelect = {
  createdAt: true,
  character: { select: characterSummarySelect },
  viaComic: { select: { id: true, title: true } },
} satisfies Prisma.DiscoverySelect;

// Solo filas de personajes que siguen desbloqueados: el registro es historia,
// pero un personaje que ha vuelto a bloquearse no puede salir hacia el navegador.
const visibleDiscoveries = (userId: string) =>
  ({ userId, character: unlockedBy(userId) }) satisfies Prisma.DiscoveryWhereInput;

/** Los últimos personajes descubiertos, uno por personaje (su descubrimiento más reciente). */
export function findRecentDiscoveries(db: Db, userId: string, take: number) {
  return db.discovery.findMany({
    where: visibleDiscoveries(userId),
    distinct: ["characterId"],
    orderBy: { createdAt: "desc" },
    take,
    select: discoverySelect,
  });
}

/** Página del registro completo (con redescubrimientos), del más reciente al más antiguo. */
export async function findDiscoveriesPage(db: PrismaClient, userId: string, page: number, pageSize: number) {
  const where = visibleDiscoveries(userId);
  const [rows, total] = await db.$transaction([
    db.discovery.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: discoverySelect,
    }),
    db.discovery.count({ where }),
  ]);
  return { rows, total };
}
