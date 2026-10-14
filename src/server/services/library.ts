import type { Zone } from "@/lib/zones";
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
import { issuesUpTo } from "@/server/domain/series-order";
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

/**
 * Cambia el estado de varios cómics a la vez (p. ej. «marcar 6 como leídos») en una sola
 * transacción: o se guardan todos o ninguno. El desbloqueo se calcula una vez para todo el lote
 * y cada personaje nuevo se atribuye al primer cómic de la lista en el que aparece.
 */
export async function setComicsStatus(
  db: PrismaClient,
  userId: string,
  comicIds: string[],
  status: ReadingStatus,
  now: Date = new Date(),
) {
  return db.$transaction(
    async (tx) => {
      const found = await tx.comic.count({ where: { id: { in: comicIds } } });
      if (found !== comicIds.length) throw new ComicNotFoundError();

      const currents = await tx.userComic.findMany({ where: { userId, comicId: { in: comicIds } } });
      const byId = new Map(currents.map((c) => [c.comicId, c]));
      const changes = comicIds
        .map((id) => {
          const current = byId.get(id) ?? null;
          return { id, current, change: applyStatusChange(current, status, now) };
        })
        .filter((c) => c.change.changed || !c.current);

      const tracksUnlocks = changes.some((c) => c.change.becameRead || c.change.stoppedBeingRead);
      const before = tracksUnlocks ? await snapshotUnlocked(tx, userId) : null;

      for (const { id, current, change } of changes) {
        await saveEntry(tx, userId, id, change.next);
        await addHistory(tx, userId, id, current?.status ?? null, status);
      }

      const unlock: UnlockResult | null = before ? await buildUnlockResult(tx, userId, before) : null;
      if (unlock?.newCharacters.length) {
        const order = new Map(changes.map((c, i) => [c.id, i]));
        const links = await tx.comicCharacter.findMany({
          where: {
            comicId: { in: changes.map((c) => c.id) },
            characterId: { in: unlock.newCharacters.map((c) => c.id) },
          },
          select: { comicId: true, characterId: true },
        });
        links.sort((a, b) => order.get(a.comicId)! - order.get(b.comicId)!);
        const byComic = new Map<string, string[]>();
        const seen = new Set<string>();
        for (const { comicId, characterId } of links) {
          if (seen.has(characterId)) continue;
          seen.add(characterId);
          byComic.set(comicId, [...(byComic.get(comicId) ?? []), characterId]);
        }
        for (const [comicId, ids] of byComic) await recordDiscoveries(tx, userId, comicId, ids);
      }

      return { changed: changes.length, unlock };
    },
    // Un lote grande son unos cientos de escrituras: más margen que el de por defecto (5 s).
    { timeout: 30_000 },
  );
}

/**
 * Los cómics de la serie de `comicId` desde el primero hasta él, que aún no has leído
 * (para «marcar como leídos hasta aquí»).
 */
export async function findUnreadUpTo(db: PrismaClient, userId: string, comicId: string) {
  const comic = await db.comic.findUnique({ where: { id: comicId }, select: { seriesId: true } });
  if (!comic) throw new ComicNotFoundError();
  const [issues, read] = await Promise.all([
    db.comic.findMany({
      where: { seriesId: comic.seriesId },
      select: { id: true, issueNumber: true, releaseDate: true },
    }),
    db.userComic.findMany({
      where: { userId, status: "READ", comic: { seriesId: comic.seriesId } },
      select: { comicId: true },
    }),
  ]);
  const readIds = new Set(read.map((r) => r.comicId));
  return issuesUpTo(issues, comicId)
    .filter((issue) => !readIds.has(issue.id))
    .map((issue) => issue.id);
}

/** Estado de lectura de unos cómics (los que no están en tu biblioteca no salen). */
export async function getStatuses(db: PrismaClient, userId: string, comicIds: string[]) {
  const rows = await db.userComic.findMany({
    where: { userId, comicId: { in: comicIds } },
    select: { comicId: true, status: true },
  });
  return new Map(rows.map((r) => [r.comicId, r.status]));
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
  isPublic = false,
) {
  return db.$transaction(async (tx) => {
    const entry = await findEntry(tx, userId, comicId);
    if (!entry) throw new NotInLibraryError();
    if (entry.status !== "READ") throw new ReviewRequiresReadError();

    return { review: toReview(await saveReview(tx, userId, comicId, body, isPublic)) };
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
  zone?: Zone,
) {
  const [{ rows, total }, grouped] = await Promise.all([
    findLibraryPage(db, userId, input, zone),
    countByStatus(db, userId, zone),
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