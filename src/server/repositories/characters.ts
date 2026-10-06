import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { comicListSelect } from "@/server/repositories/comics";

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

/** Un coleccionable con los cómics de la biblioteca del usuario donde aparece. */
export function findCharacterWithLibrary(db: Db, id: string, userId: string) {
  return db.character.findFirst({
    where: { id, isCollectible: true },
    select: {
      ...characterSummarySelect,
      realName: true,
      summary: true,
      imageUrl: true,
      appearancesCount: true,
      firstAppearanceExternalId: true,
      publisher: { select: { name: true } },
      comics: {
        where: { comic: { userEntries: { some: { userId } } } },
        orderBy: { comic: { releaseDate: "asc" } },
        select: {
          comic: {
            select: {
              ...comicListSelect,
              userEntries: { where: { userId }, select: { status: true } },
            },
          },
        },
      },
    },
  });
}

export function findComicByExternalId(db: Db, externalId: string) {
  return db.comic.findFirst({
    where: { source: "COMICVINE", externalId },
    select: { id: true, title: true },
  });
}
