import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  ComicNotFoundError,
  listLibrary,
  NotInLibraryError,
  RatingRequiresReadError,
  removeFromLibrary,
  setComicStatus,
  updateLibraryEntry,
} from "@/server/services/library";
import { createComic, createTestDb, createUser, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

function history(userId: string, comicId: string) {
  return db.readingHistory.findMany({
    where: { userId, comicId },
    orderBy: { createdAt: "asc" },
    select: { fromStatus: true, toStatus: true },
  });
}

describe("setComicStatus", () => {
  it("añade el cómic a la biblioteca y lo anota en el historial", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);

    const result = await setComicStatus(db, user.id, comic.id, "PENDING");

    expect(result.changed).toBe(true);
    expect(result.entry.status).toBe("PENDING");
    expect(await history(user.id, comic.id)).toEqual([
      { fromStatus: null, toStatus: "PENDING" },
    ]);
  });

  it("Leyendo guarda startedAt, Leído lo conserva y guarda readAt", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);
    const t1 = new Date("2026-10-01T10:00:00Z");
    const t2 = new Date("2026-10-02T10:00:00Z");

    await setComicStatus(db, user.id, comic.id, "READING", t1);
    const result = await setComicStatus(db, user.id, comic.id, "READ", t2);

    expect(result.becameRead).toBe(true);
    expect(result.entry.startedAt).toBe(t1.toISOString());
    expect(result.entry.readAt).toBe(t2.toISOString());
  });

  it("repetir el mismo estado no cambia nada ni anota historial", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);

    await setComicStatus(db, user.id, comic.id, "READ");
    const result = await setComicStatus(db, user.id, comic.id, "READ");

    expect(result.changed).toBe(false);
    expect(result.becameRead).toBe(false);
    expect(await history(user.id, comic.id)).toHaveLength(1);
  });

  it("salir de Leído borra readAt y avisa con stoppedBeingRead", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);

    await setComicStatus(db, user.id, comic.id, "READ");
    const result = await setComicStatus(db, user.id, comic.id, "DROPPED");

    expect(result.stoppedBeingRead).toBe(true);
    expect(result.entry.readAt).toBeNull();
  });

  it("falla con ComicNotFoundError si el cómic no existe y no guarda nada", async () => {
    const user = await createUser(db);
    const missingId = "00000000-0000-4000-8000-000000000000";

    await expect(setComicStatus(db, user.id, missingId, "READ")).rejects.toThrow(
      ComicNotFoundError,
    );
    expect(await db.userComic.count()).toBe(0);
    expect(await db.readingHistory.count()).toBe(0);
  });

  it("dos peticiones simultáneas a Leído dejan una sola entrada", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);

    await Promise.all([
      setComicStatus(db, user.id, comic.id, "READ"),
      setComicStatus(db, user.id, comic.id, "READ"),
    ]);

    expect(await db.userComic.count({ where: { userId: user.id } })).toBe(1);
  });
});

describe("updateLibraryEntry", () => {
  it("solo deja puntuar cómics en Leído", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);
    await setComicStatus(db, user.id, comic.id, "READING");

    await expect(
      updateLibraryEntry(db, user.id, comic.id, { rating: 4 }),
    ).rejects.toThrow(RatingRequiresReadError);

    await setComicStatus(db, user.id, comic.id, "READ");
    const result = await updateLibraryEntry(db, user.id, comic.id, { rating: 4 });
    expect(result.entry.rating).toBe(4);
  });

  it("al salir de Leído la puntuación se oculta y vuelve al regresar", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);
    await setComicStatus(db, user.id, comic.id, "READ");
    await updateLibraryEntry(db, user.id, comic.id, { rating: 5 });

    const dropped = await setComicStatus(db, user.id, comic.id, "DROPPED");
    expect(dropped.entry.rating).toBeNull();

    const reread = await setComicStatus(db, user.id, comic.id, "READ");
    expect(reread.entry.rating).toBe(5);
  });

  it("marca y desmarca favorito en cualquier estado", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);
    await setComicStatus(db, user.id, comic.id, "PENDING");

    const on = await updateLibraryEntry(db, user.id, comic.id, { isFavorite: true });
    expect(on.entry.isFavorite).toBe(true);
    const off = await updateLibraryEntry(db, user.id, comic.id, { isFavorite: false });
    expect(off.entry.isFavorite).toBe(false);
  });

  it("falla con NotInLibraryError si el cómic no está en la biblioteca", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);

    await expect(
      updateLibraryEntry(db, user.id, comic.id, { isFavorite: true }),
    ).rejects.toThrow(NotInLibraryError);
  });
});

describe("removeFromLibrary", () => {
  it("quita el cómic, anota el historial y la segunda vez no es error", async () => {
    const user = await createUser(db);
    const comic = await createComic(db);
    await setComicStatus(db, user.id, comic.id, "READ");

    expect(await removeFromLibrary(db, user.id, comic.id)).toEqual({
      removed: true,
      stoppedBeingRead: true,
    });
    expect(await removeFromLibrary(db, user.id, comic.id)).toEqual({
      removed: false,
      stoppedBeingRead: false,
    });
    expect(await history(user.id, comic.id)).toEqual([
      { fromStatus: null, toStatus: "READ" },
      { fromStatus: "READ", toStatus: null },
    ]);
  });
});

describe("listLibrary", () => {
  it("solo devuelve la biblioteca del usuario, con contadores, filtro y paginación", async () => {
    const user = await createUser(db);
    const other = await createUser(db);
    const [a, b, c] = [await createComic(db), await createComic(db), await createComic(db)];
    await setComicStatus(db, user.id, a.id, "READ");
    await setComicStatus(db, user.id, b.id, "READ");
    await setComicStatus(db, user.id, c.id, "PENDING");
    await setComicStatus(db, other.id, a.id, "DROPPED");

    const all = await listLibrary(db, user.id, { page: 1, pageSize: 2 });
    expect(all.total).toBe(3);
    expect(all.totalPages).toBe(2);
    expect(all.items).toHaveLength(2);
    expect(all.counts).toEqual({ PENDING: 1, READING: 0, READ: 2, DROPPED: 0 });

    const read = await listLibrary(db, user.id, { status: "READ", page: 1, pageSize: 24 });
    expect(read.items.map((i) => i.comic.id).sort()).toEqual([a.id, b.id].sort());
  });
});
