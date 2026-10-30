import type { Zone } from "@/lib/zones";
import { comicInZone } from "@/server/repositories/comics";
import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type {
  LibraryEntryState,
  ReadingStatus,
} from "@/server/domain/library-status";
import { comicListSelect } from "@/server/repositories/comics";
import type { LibrarySearchInput } from "@/server/validation/library";

// Acepta tanto la conexión normal como una transacción en curso.
type Db = PrismaClient | Prisma.TransactionClient;

export function findEntry(db: Db, userId: string, comicId: string) {
  return db.userComic.findUnique({
    where: { userId_comicId: { userId, comicId } },
  });
}

export function saveEntry(
  db: Db,
  userId: string,
  comicId: string,
  state: LibraryEntryState,
) {
  return db.userComic.upsert({
    where: { userId_comicId: { userId, comicId } },
    create: { userId, comicId, ...state },
    update: { ...state },
  });
}

export function updateEntry(
  db: Db,
  userId: string,
  comicId: string,
  data: { rating?: number | null; isFavorite?: boolean },
) {
  return db.userComic.update({
    where: { userId_comicId: { userId, comicId } },
    data,
  });
}

export function findReview(db: Db, userId: string, comicId: string) {
  return db.review.findUnique({
    where: { userId_comicId: { userId, comicId } },
    include: { entry: { select: { status: true } } },
  });
}

export function saveReview(db: Db, userId: string, comicId: string, body: string, isPublic: boolean) {
  return db.review.upsert({
    where: { userId_comicId: { userId, comicId } },
    create: { userId, comicId, body, isPublic },
    update: { body, isPublic },
  });
}

export function deleteReview(db: Db, userId: string, comicId: string) {
  return db.review.deleteMany({ where: { userId, comicId } });
}

export function deleteEntry(db: Db, userId: string, comicId: string) {
  return db.userComic.deleteMany({ where: { userId, comicId } });
}

export function addHistory(
  db: Db,
  userId: string,
  comicId: string,
  fromStatus: ReadingStatus | null,
  toStatus: ReadingStatus | null,
) {
  return db.readingHistory.create({
    data: { userId, comicId, fromStatus, toStatus },
  });
}

export async function findLibraryPage(
  db: PrismaClient,
  userId: string,
  input: Omit<LibrarySearchInput, "view" | "order">,
  zone?: Zone,
) {
  const where: Prisma.UserComicWhereInput = {
    userId,
    ...(input.status ? { status: input.status } : {}),
    comic: { ...comicInZone(zone), ...(input.series ? { seriesId: input.series } : {}) },
  };

  const [rows, total] = await db.$transaction([
    db.userComic.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { comicId: "asc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: {
        status: true,
        isFavorite: true,
        rating: true,
        startedAt: true,
        readAt: true,
        updatedAt: true,
        comic: { select: comicListSelect },
      },
    }),
    db.userComic.count({ where }),
  ]);

  return { rows, total };
}

/** Últimos cambios del historial de lectura, con el cómic. */
/** Todas tus entradas (con su serie) para agrupar la biblioteca en carpetas, las más recientes primero. */
export function findLibrarySeriesRows(db: PrismaClient, userId: string, status?: ReadingStatus, zone?: Zone) {
  return db.userComic.findMany({
    where: { userId, ...(status ? { status } : {}), comic: comicInZone(zone) },
    orderBy: [{ updatedAt: "desc" }, { comicId: "asc" }],
    select: {
      status: true,
      comic: { select: { coverThumbUrl: true, series: { select: { id: true, name: true, startYear: true, _count: { select: { comics: true } } } } } },
    },
  });
}

export function findRecentHistory(db: PrismaClient, userId: string, take: number, zone?: Zone) {
  return db.readingHistory.findMany({
    where: { userId, ...(zone ? { comic: comicInZone(zone) } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take,
    select: {
      fromStatus: true,
      toStatus: true,
      createdAt: true,
      comic: { select: { id: true, title: true } },
    },
  });
}

export function countByStatus(db: PrismaClient, userId: string, zone?: Zone) {
  return db.userComic.groupBy({
    by: ["status"],
    where: { userId, ...(zone ? { comic: comicInZone(zone) } : {}) },
    _count: { _all: true },
  });
}
/** Series que estás leyendo (con algo leído o en curso), la de tu último movimiento primero. */
export async function findActiveSeriesIds(db: PrismaClient, userId: string, take: number, zone?: Zone) {
  const rows = await db.userComic.findMany({
    where: { userId, status: { in: ["READ", "READING"] }, comic: comicInZone(zone) },
    orderBy: [{ updatedAt: "desc" }, { comicId: "asc" }],
    take: 300,
    select: { comic: { select: { seriesId: true } } },
  });
  return [...new Set(rows.map((r) => r.comic.seriesId))].slice(0, take);
}

/** Todos los números de esas series, con tu estado en cada uno. */
export function findSeriesIssues(db: PrismaClient, userId: string, seriesIds: string[]) {
  return db.comic.findMany({
    where: { seriesId: { in: seriesIds } },
    select: {
      id: true,
      title: true,
      issueNumber: true,
      releaseDate: true,
      coverThumbUrl: true,
      seriesId: true,
      series: { select: { name: true } },
      userEntries: { where: { userId }, select: { status: true } },
    },
  });
}

/** Números salidos desde `since` de series que sigues (con algo no abandonado) y que aún no tienes. */
export function findNewIssues(db: PrismaClient, userId: string, since: Date, zone?: Zone) {
  return db.comic.findMany({
    where: {
      // AND: comicInZone también filtra por `series` y no debe pisarse con la condición de abajo.
      AND: [
        comicInZone(zone),
        { series: { comics: { some: { userEntries: { some: { userId, status: { not: "DROPPED" } } } } } } },
      ],
      releaseDate: { gte: since, lte: new Date() },
      userEntries: { none: { userId } },
    },
    orderBy: [{ releaseDate: "desc" }, { id: "asc" }],
    take: 60,
    select: { id: true, title: true, coverThumbUrl: true, series: { select: { id: true, name: true } } },
  });
}

/** Fechas de lectura de tus cómics leídos (sin fecha guardada, la del último cambio). */
export async function findReadDates(db: PrismaClient, userId: string, zone?: Zone) {
  const rows = await db.userComic.findMany({
    where: { userId, status: "READ", comic: comicInZone(zone) },
    select: { readAt: true, updatedAt: true },
  });
  return rows.map((r) => r.readAt ?? r.updatedAt);
}
