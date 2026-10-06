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

export function saveReview(db: Db, userId: string, comicId: string, body: string) {
  return db.review.upsert({
    where: { userId_comicId: { userId, comicId } },
    create: { userId, comicId, body },
    update: { body },
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
  input: LibrarySearchInput,
) {
  const where: Prisma.UserComicWhereInput = {
    userId,
    ...(input.status ? { status: input.status } : {}),
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

export function countByStatus(db: PrismaClient, userId: string) {
  return db.userComic.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
}