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
 * LA definición de "desbloqueado": coleccionable que aparece en al menos un cómic
 * que el usuario tiene en Leído. Se calcula siempre: no hay copia que mantener.
 * Todas las consultas que filtran por desbloqueado usan esta función.
 */
export function unlockedBy(userId: string) {
  return {
    isCollectible: true,
    comics: { some: { comic: { userEntries: { some: { userId, status: "READ" as const } } } } },
  } satisfies Prisma.CharacterWhereInput;
}

export function findUnlockedCharacters(db: Db, userId: string) {
  return db.character.findMany({
    where: unlockedBy(userId),
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
      catalogNumber: true,
      favorites: { where: { userId }, select: { userId: true } },
      _count: {
        select: {
          comics: {
            where: { comic: { userEntries: { some: { userId, status: "READ" } } } },
          },
        },
      },
    },
    orderBy: [{ catalogNumber: { sort: "asc", nulls: "last" } }, { name: "asc" }],
  });
}

/** Misma regla que findUnlockedCharacters, para un solo personaje. */
export async function isCharacterUnlocked(db: Db, userId: string, id: string) {
  const count = await db.character.count({ where: { id, ...unlockedBy(userId) } });
  return count > 0;
}

export function addFavorite(db: Db, userId: string, characterId: string) {
  return db.characterFavorite.upsert({
    where: { userId_characterId: { userId, characterId } },
    create: { userId, characterId },
    update: {},
  });
}

export function removeFavorite(db: Db, userId: string, characterId: string) {
  return db.characterFavorite.deleteMany({ where: { userId, characterId } });
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
      favorites: { where: { userId }, select: { userId: true } },
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

/** Parejas de coleccionables que comparten cómics (a < b), con cuántos comparten. */
export function findCoAppearancePairs(db: Db) {
  return db.$queryRaw<{ a: string; b: string; shared: number }[]>`
    SELECT x."characterId" AS a, y."characterId" AS b, count(*)::int AS shared
    FROM "ComicCharacter" x
    JOIN "ComicCharacter" y ON y."comicId" = x."comicId" AND x."characterId" < y."characterId"
    JOIN "Character" cx ON cx.id = x."characterId" AND cx."isCollectible"
    JOIN "Character" cy ON cy.id = y."characterId" AND cy."isCollectible"
    GROUP BY 1, 2`;
}

export function findCuratedRelationships(db: Db) {
  return db.characterRelationship.findMany({
    select: { characterAId: true, characterBId: true, type: true },
  });
}

/** Cuántos cómics importados tiene cada coleccionable. */
export function countComicsPerCharacter(db: Db) {
  return db.$queryRaw<{ id: string; comics: number }[]>`
    SELECT cc."characterId" AS id, count(*)::int AS comics
    FROM "ComicCharacter" cc
    JOIN "Character" c ON c.id = cc."characterId" AND c."isCollectible"
    GROUP BY 1`;
}

export interface AlbumRow {
  seriesId: string;
  seriesName: string;
  startYear: number | null;
  /** null si la serie aún no tiene personajes conocidos (sus cómics no se han abierto). */
  characterId: string | null;
  firstAppearance: Date | null;
}

/**
 * Álbumes de la zona: cada serie de la editorial con algún cómic en la biblioteca del usuario,
 * con sus personajes coleccionables y el primer cómic de la serie en que aparece cada uno.
 */
export function findAlbumRows(db: Db, userId: string, publisherSlug: string) {
  return db.$queryRaw<AlbumRow[]>`
    SELECT s.id AS "seriesId", s.name AS "seriesName", s."startYear" AS "startYear",
           c.id AS "characterId", MIN(co."releaseDate") AS "firstAppearance"
    FROM "Series" s
    JOIN "Publisher" p ON p.id = s."publisherId" AND p.slug = ${publisherSlug}
    LEFT JOIN "Comic" co ON co."seriesId" = s.id
    LEFT JOIN "ComicCharacter" cc ON cc."comicId" = co.id
    LEFT JOIN "Character" c ON c.id = cc."characterId" AND c."isCollectible"
    WHERE s.id IN (
      SELECT co2."seriesId" FROM "UserComic" uc
      JOIN "Comic" co2 ON co2.id = uc."comicId"
      WHERE uc."userId" = ${userId}
    )
    GROUP BY s.id, s.name, s."startYear", c.id
  `;
}

/** El álbum de una sola serie (vacío si el usuario no tiene ningún cómic de ella). */
export function findSeriesAlbumRows(db: Db, userId: string, seriesId: string) {
  return db.$queryRaw<AlbumRow[]>`
    SELECT s.id AS "seriesId", s.name AS "seriesName", s."startYear" AS "startYear",
           c.id AS "characterId", MIN(co."releaseDate") AS "firstAppearance"
    FROM "Series" s
    LEFT JOIN "Comic" co ON co."seriesId" = s.id
    LEFT JOIN "ComicCharacter" cc ON cc."comicId" = co.id
    LEFT JOIN "Character" c ON c.id = cc."characterId" AND c."isCollectible"
    WHERE s.id = ${seriesId}
      AND EXISTS (
        SELECT 1 FROM "UserComic" uc
        JOIN "Comic" co2 ON co2.id = uc."comicId"
        WHERE uc."userId" = ${userId} AND co2."seriesId" = s.id
      )
    GROUP BY s.id, s.name, s."startYear", c.id
  `;
}

/** Portada de cada serie: la de su primer cómic con portada (para la tapa del álbum). */
export async function findSeriesCovers(db: Db, seriesIds: string[]) {
  const rows = await db.comic.findMany({
    where: { seriesId: { in: seriesIds }, coverThumbUrl: { not: null } },
    distinct: ["seriesId"],
    orderBy: [{ seriesId: "asc" }, { releaseDate: { sort: "asc", nulls: "last" } }],
    select: { seriesId: true, coverThumbUrl: true },
  });
  return new Map(rows.map((r) => [r.seriesId, r.coverThumbUrl]));
}
