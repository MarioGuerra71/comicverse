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
} from "@/server/repositories/library";
import type { LibrarySearchInput } from "@/server/validation/library";

export class ComicNotFoundError extends Error {
  constructor() {
    super("Comic not found");
    this.name = "ComicNotFoundError";
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