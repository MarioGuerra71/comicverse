import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { characterSummarySelect } from "@/server/repositories/characters";

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

/** Últimas filas del registro, con el personaje y el cómic. */
export function findRecentDiscoveries(db: Db, userId: string, take: number) {
  return db.discovery.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      createdAt: true,
      character: { select: characterSummarySelect },
      viaComic: { select: { id: true, title: true } },
    },
  });
}
