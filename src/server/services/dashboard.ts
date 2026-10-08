import type { Zone } from "@/lib/zones";
import type { PrismaClient } from "../../../generated/prisma/client";
import { toCharacterSummary, type CharacterSummaryDto } from "@/server/dto/character";
import { countSeriesProgress } from "@/server/repositories/comics";
import { findDiscoveriesPage, findRecentDiscoveries } from "@/server/repositories/discoveries";
import { countByStatus, findRecentHistory } from "@/server/repositories/library";
import type { ReadingStatus } from "@/server/domain/library-status";
import type { PageInput } from "@/server/validation/discoveries";
import { getUniverse } from "@/server/services/discovery";
import { listLibrary, toStatusCounts } from "@/server/services/library";

export interface DiscoveryDto {
  character: CharacterSummaryDto;
  viaComic: { id: string; title: string } | null;
  discoveredAt: string;
}

/** Progreso del universo para el dashboard (todo calculado de nuestros datos). */
export async function getDashboardStats(db: PrismaClient, userId: string, zone?: Zone) {
  const [grouped, universe, series] = await Promise.all([
    countByStatus(db, userId, zone),
    getUniverse(db, userId, zone),
    countSeriesProgress(db, userId, zone),
  ]);
  const library = toStatusCounts(grouped);
  const unlockedIds = new Set(universe.cards.map((c) => c.id));
  return {
    library: { ...library, total: Object.values(library).reduce((a, b) => a + b, 0) },
    characters: universe.progress,
    relationships: {
      discovered: universe.relationships.filter((r) => unlockedIds.has(r.a) && unlockedIds.has(r.b)).length,
      total: universe.relationships.length,
    },
    series,
  };
}

const toDiscovery = (row: Awaited<ReturnType<typeof findRecentDiscoveries>>[number]): DiscoveryDto => ({
  character: toCharacterSummary(row.character),
  viaComic: row.viaComic,
  discoveredAt: row.createdAt.toISOString(),
});

/** Últimos personajes descubiertos (uno por personaje, solo los que siguen desbloqueados). */
export async function getRecentDiscoveries(db: PrismaClient, userId: string, limit: number, zone?: Zone) {
  return (await findRecentDiscoveries(db, userId, limit, zone)).map(toDiscovery);
}

/** Registro completo paginado (incluye redescubrimientos; nunca personajes bloqueados). */
export async function listDiscoveries(db: PrismaClient, userId: string, input: PageInput, zone?: Zone) {
  const { rows, total } = await findDiscoveriesPage(db, userId, input.page, input.pageSize, zone);
  return {
    items: rows.map(toDiscovery),
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

export interface ActivityDto {
  comic: { id: string; title: string };
  fromStatus: ReadingStatus | null;
  toStatus: ReadingStatus | null;
  at: string;
}

/** Últimos cambios en la biblioteca (del historial de lectura). */
export async function getRecentActivity(db: PrismaClient, userId: string, limit: number, zone?: Zone) {
  const rows = await findRecentHistory(db, userId, limit, zone);
  return rows.map(
    (r): ActivityDto => ({
      comic: r.comic,
      fromStatus: r.fromStatus,
      toStatus: r.toStatus,
      at: r.createdAt.toISOString(),
    }),
  );
}

/** Todo lo que necesita la portada privada. */
export async function getDashboard(db: PrismaClient, userId: string, zone?: Zone) {
  const [stats, recentLibrary, recentDiscoveries, activity] = await Promise.all([
    getDashboardStats(db, userId, zone),
    listLibrary(db, userId, { page: 1, pageSize: 6 }, zone),
    getRecentDiscoveries(db, userId, 6, zone),
    getRecentActivity(db, userId, 8, zone),
  ]);
  return { stats, recentComics: recentLibrary.items, recentDiscoveries, activity };
}
