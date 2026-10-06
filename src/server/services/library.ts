import type { PrismaClient } from "../../../generated/prisma/client";
import {
  applyStatusChange,
  type ReadingStatus,
} from "@/server/domain/library-status";
import { toLibraryEntry, toLibraryItem, toReview } from "@/server/dto/library";
import {
  buildUnlockResult,
  snapshotUnlocked,
  type UnlockResult,
} from "@/server/services/discovery";
import {
  addHistory,
  countByStatus,
  deleteEntry,
  deleteReview,
  findEntry,
  findLibraryPage,
  findReview,
  saveEntry,
  saveReview,
  updateEntry,
} from "@/server/repositories/library";
import { recordDiscoveries } from "@/server/repositories/discoveries";
import type {
  LibrarySearchInput,
  UpdateEntryInput,
} from "@/server/validation/library";

export class ComicNotFoundError extends Error {
  constructor() {
    super("Comic not found");
    this.name = "ComicNotFoundError";
  }
}

export class NotInLibraryError extends Error {
  constructor() {
    super("Comic not in library");
    this.name = "NotInLibraryError";
  }
}

export class RatingRequiresReadError extends Error {
  constructor() {
    super("Only read comics can be rated");
    this.name = "RatingRequiresReadError";
  }
}

export class ReviewRequiresReadError extends Error {
  constructor() {
    super("Only read comics can be reviewed");
    this.name = "ReviewRequiresReadError";
  }
}

export async function setComicStatus(
  db: PrismaClient,
  userId: string,
  comicId: string,
  status: ReadingStatus,
  now: Date = new Date(),
) {
  return db.$transaction(async (tx) => {
    const comic = await tx.comic.findUnique({
      where: { id: comicId },
      select: { id: true },
    });
    if (!comic) throw new ComicNotFoundError();

    const current = await findEntry(tx, userId, comicId);
    const change = applyStatusChange(current, status, now);

    if (!change.changed && current) {
      return {
        entry: toLibraryEntry(current),
        changed: false,
        becameRead: false,
        stoppedBeingRead: false,
        unlock: null,
      };
    }

    // Solo entrar o salir de Leído cambia los desbloqueos.
    const tracksUnlocks = change.becameRead || change.stoppedBeingRead;
    const before = tracksUnlocks ? await snapshotUnlocked(tx, userId) : null;

    const saved = await saveEntry(tx, userId, comicId, change.next);
    await addHistory(tx, userId, comicId, current?.status ?? null, status);

    const unlock: UnlockResult | null = before
      ? await buildUnlockResult(tx, userId, before)
      : null;
    if (unlock?.newCharacters.length) {
      const newIds = unlock.newCharacters.map((c) => c.id);
      await recordDiscoveries(tx, userId, comicId, newIds);
    }

    return {
      entry: toLibraryEntry(saved),
      changed: true,
      becameRead: change.becameRead,
      stoppedBeingRead: change.stoppedBeingRead,
      unlock,
    };
  });
}

export async function removeFromLibrary(
  db: PrismaClient,
  userId: string,
  comicId: string,
) {
  return db.$transaction(async (tx) => {
    const current = await findEntry(tx, userId, comicId);
    if (!current) return { removed: false, stoppedBeingRead: false, unlock: null };

    const stoppedBeingRead = current.status === "READ";
    const before = stoppedBeingRead ? await snapshotUnlocked(tx, userId) : null;

    await deleteEntry(tx, userId, comicId);
    await addHistory(tx, userId, comicId, current.status, null);

    const unlock = before ? await buildUnlockResult(tx, userId, before) : null;
    return { removed: true, stoppedBeingRead, unlock };
  });
}

/** Cambia puntuación y/o favorito de un cómic que ya está en la biblioteca. */
export async function updateLibraryEntry(
  db: PrismaClient,
  userId: string,
  comicId: string,
  changes: UpdateEntryInput,
) {
  return db.$transaction(async (tx) => {
    const current = await findEntry(tx, userId, comicId);
    if (!current) throw new NotInLibraryError();
    // Quitar la puntuación (null) siempre se permite; ponerla, solo en Leído.
    if (changes.rating != null && current.status !== "READ") {
      throw new RatingRequiresReadError();
    }
    const saved = await updateEntry(tx, userId, comicId, changes);
    return { entry: toLibraryEntry(saved) };
  });
}

/** La reseña se conserva al salir de Leído, pero (como la puntuación) solo se muestra en Leído. */
export async function getReview(db: PrismaClient, userId: string, comicId: string) {
  const row = await findReview(db, userId, comicId);
  return row && row.entry.status === "READ" ? toReview(row) : null;
}

export async function writeReview(
  db: PrismaClient,
  userId: string,
  comicId: string,
  body: string,
) {
  return db.$transaction(async (tx) => {
    const entry = await findEntry(tx, userId, comicId);
    if (!entry) throw new NotInLibraryError();
    if (entry.status !== "READ") throw new ReviewRequiresReadError();

    return { review: toReview(await saveReview(tx, userId, comicId, body)) };
  });
}

export async function removeReview(db: PrismaClient, userId: string, comicId: string) {
  const { count } = await deleteReview(db, userId, comicId);
  return { removed: count > 0 };
}

export async function getLibraryEntry(
  db: PrismaClient,
  userId: string,
  comicId: string,
) {
  const entry = await findEntry(db, userId, comicId);
  return entry ? toLibraryEntry(entry) : null;
}

/** Contadores por estado, con 0 en los estados sin cómics. */
export function toStatusCounts(grouped: { status: ReadingStatus; _count: { _all: number } }[]) {
  const counts: Record<ReadingStatus, number> = { PENDING: 0, READING: 0, READ: 0, DROPPED: 0 };
  for (const group of grouped) counts[group.status] = group._count._all;
  return counts;
}

export async function listLibrary(
  db: PrismaClient,
  userId: string,
  input: LibrarySearchInput,
) {
  const [{ rows, total }, grouped] = await Promise.all([
    findLibraryPage(db, userId, input),
    countByStatus(db, userId),
  ]);

  return {
    items: rows.map(toLibraryItem),
    counts: toStatusCounts(grouped),
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}