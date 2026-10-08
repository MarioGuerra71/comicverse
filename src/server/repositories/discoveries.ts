import type { Zone } from "@/lib/zones";
import { comicInZone } from "@/server/repositories/comics";
import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { characterSummarySelect, unlockedBy } from "@/server/repositories/characters";

type Db = PrismaClient | Prisma.TransactionClient;

/** Apunta en el registro los personajes recién desbloqueados con un cómic. */
export function recordDiscoveries(
  db: Db,
  userId: string,
  viaComicId: string,
  characterIds: string[],
) {
  return db.discovery.createMany({
    data: characterIds.map((characterId) => ({ userId, characterId, viaComicId })),
  });
}

const discoverySelect = {
  createdAt: true,
  character: { select: characterSummarySelect },
  viaComic: { select: { id: true, title: true } },
} satisfies Prisma.DiscoverySelect;

// Solo filas de personajes que siguen desbloqueados: el registro es historia,
// pero un personaje que ha vuelto a bloquearse no puede salir hacia el navegador.
const visibleDiscoveries = (userId: string) =>
  ({ userId, character: unlockedBy(userId) }) satisfies Prisma.DiscoveryWhereInput;

/** Los últimos personajes descubiertos, uno por personaje (su descubrimiento más reciente). */
export function findRecentDiscoveries(db: Db, userId: string, take: number, zone?: Zone) {
  return db.discovery.findMany({
    where: { ...visibleDiscoveries(userId), ...(zone ? { viaComic: comicInZone(zone) } : {}) },
    distinct: ["characterId"],
    orderBy: { createdAt: "desc" },
    take,
    select: discoverySelect,
  });
}

/** Página del registro completo (con redescubrimientos), del más reciente al más antiguo. */
export async function findDiscoveriesPage(
  db: PrismaClient,
  userId: string,
  page: number,
  pageSize: number,
  zone?: Zone,
) {
  const where = { ...visibleDiscoveries(userId), ...(zone ? { viaComic: comicInZone(zone) } : {}) };
  const [rows, total] = await db.$transaction([
    db.discovery.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: discoverySelect,
    }),
    db.discovery.count({ where }),
  ]);
  return { rows, total };
}

/**
 * Personajes descubiertos desde la última visita a "Mi colección" (y aún desbloqueados).
 * Sin visita previa, todo lo descubierto cuenta como nuevo.
 */
export async function findNewCharacterIds(db: Db, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { collectionSeenAt: true } });
  const since = user?.collectionSeenAt;
  const rows = await db.discovery.findMany({
    where: { ...visibleDiscoveries(userId), ...(since ? { createdAt: { gt: since } } : {}) },
    distinct: ["characterId"],
    select: { characterId: true },
  });
  return new Set(rows.map((r) => r.characterId));
}

export function markCollectionSeen(db: Db, userId: string, now = new Date()) {
  return db.user.update({ where: { id: userId }, data: { collectionSeenAt: now } });
}
