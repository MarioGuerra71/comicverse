import type { PrismaClient } from "../../../generated/prisma/client";
import { toCharacterSummary, type CharacterSummaryDto } from "@/server/dto/character";
import { countSeriesProgress } from "@/server/repositories/comics";
import { findDiscoveriesPage, findRecentDiscoveries } from "@/server/repositories/discoveries";
import { countByStatus, findRecentHistory } from "@/server/repositories/library";
import type { ReadingStatus } from "@/server/domain/library-status";
import type { PageInput } from "@/server/validation/discoveries";
import { getCollection } from "@/server/services/discovery";
import { listLibrary, toStatusCounts } from "@/server/services/library";

export interface DiscoveryDto {
  character: CharacterSummaryDto;
  viaComic: { id: string; title: string } | null;
  discoveredAt: string;
}

/** Progreso del universo para el dashboard (todo calculado de nuestros datos). */
export async function getDashboardStats(db: PrismaClient, userId: string) {
  const [grouped, collection, series] = await Promise.all([
    countByStatus(db, userId),
    getCollection(db, userId),
    countSeriesProgress(db, userId),
  ]);
  const library = toStatusCounts(grouped);
  return {
    library: { ...library, total: Object.values(library).reduce((a, b) => a + b, 0) },
    characters: collection.progress,
    relationships: collection.relationships,
    series,
  };
}

const toDiscovery = (row: Awaited<ReturnType<typeof findRecentDiscoveries>>[number]): DiscoveryDto => ({
  character: toCharacterSummary(row.character),
  viaComic: row.viaComic,
  discoveredAt: row.createdAt.toISOString(),
});

/** Últimos personajes descubiertos (uno por personaje, solo los que siguen desbloqueados). */
export async function getRecentDiscoveries(db: PrismaClient, userId: string, limit: number) {
  return (await findRecentDiscoveries(db, userId, limit)).map(toDiscovery);
}

/** Registro completo paginado (incluye redescubrimientos; nunca personajes bloqueados). */
export async function listDiscoveries(db: PrismaClient, userId: string, input: PageInput) {
  const { rows, total } = await findDiscoveriesPage(db, userId, input.page, input.pageSize);
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
export async function getRecentActivity(db: PrismaClient, userId: string, limit: number) {
  const rows = await findRecentHistory(db, userId, limit);
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
export async function getDashboard(db: PrismaClient, userId: string) {
  const [stats, recentLibrary, recentDiscoveries, activity] = await Promise.all([
    getDashboardStats(db, userId),
    listLibrary(db, userId, { page: 1, pageSize: 6 }),
    getRecentDiscoveries(db, userId, 6),
    getRecentActivity(db, userId, 8),
  ]);
  return { stats, recentComics: recentLibrary.items, recentDiscoveries, activity };
}
