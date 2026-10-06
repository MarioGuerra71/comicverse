import type { Prisma, PrismaClient } from "../../../generated/prisma/client";

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
