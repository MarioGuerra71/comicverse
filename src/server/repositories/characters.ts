import type { Prisma, PrismaClient } from "../../../generated/prisma/client";

// Acepta tanto la conexión normal como una transacción en curso.
type Db = PrismaClient | Prisma.TransactionClient;

export const characterSummarySelect = {
  id: true,
  name: true,
  displayName: true,
  imageThumbUrl: true,
} satisfies Prisma.CharacterSelect;

/**
 * Personajes desbloqueados = coleccionables que aparecen en al menos un cómic
 * que el usuario tiene en Leído. Se calcula siempre: no hay copia que mantener.
 */
export function findUnlockedCharacters(db: Db, userId: string) {
  return db.character.findMany({
    where: {
      isCollectible: true,
      comics: {
        some: { comic: { userEntries: { some: { userId, status: "READ" } } } },
      },
    },
    select: characterSummarySelect,
    orderBy: { name: "asc" },
  });
}

/** Todos los coleccionables con cuántos cómics leídos por el usuario aparecen. */
export function findCollection(db: Db, userId: string) {
  return db.character.findMany({
    where: { isCollectible: true },
    select: {
      ...characterSummarySelect,
      realName: true,
      _count: {
        select: {
          comics: {
            where: { comic: { userEntries: { some: { userId, status: "READ" } } } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export function countCollectibleCharacters(db: Db) {
  return db.character.count({ where: { isCollectible: true } });
}
