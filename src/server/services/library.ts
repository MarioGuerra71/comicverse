import type { PrismaClient } from "../../../generated/prisma/client";
import {
  applyStatusChange,
  type ReadingStatus,
} from "@/server/domain/library-status";
import { toLibraryEntry, toLibraryItem } from "@/server/dto/library";
import {
  addHistory,
  countByStatus,
  deleteEntry,
  findEntry,
  findLibraryPage,
  saveEntry,
  updateEntry,
} from "@/server/repositories/library";
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
      };
    }

    const saved = await saveEntry(tx, userId, comicId, change.next);
    await addHistory(tx, userId, comicId, current?.status ?? null, status);

    // Fase 5: aquí, dentro de esta misma transacción, se ejecutará el
    // desbloqueo de personajes (becameRead) o su reajuste (stoppedBeingRead).

    return {
      entry: toLibraryEntry(saved),
      changed: true,
      becameRead: change.becameRead,
      stoppedBeingRead: change.stoppedBeingRead,
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
    if (!current) return { removed: false, stoppedBeingRead: false };

    await deleteEntry(tx, userId, comicId);
    await addHistory(tx, userId, comicId, current.status, null);

    // Fase 5: si estaba Leído, aquí se reajustarán los desbloqueos.
    return { removed: true, stoppedBeingRead: current.status === "READ" };
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

export async function getLibraryEntry(
  db: PrismaClient,
  userId: string,
  comicId: string,
) {
  const entry = await findEntry(db, userId, comicId);
  return entry ? toLibraryEntry(entry) : null;
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

  const counts: Record<ReadingStatus, number> = {
    PENDING: 0,
    READING: 0,
    READ: 0,
    DROPPED: 0,
  };
  for (const group of grouped) counts[group.status] = group._count._all;

  return {
    items: rows.map(toLibraryItem),
    counts,
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}