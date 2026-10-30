import type { Zone } from "@/lib/zones";
import type { PrismaClient } from "../../../generated/prisma/client";
import { toCharacterSummary, type CharacterSummaryDto } from "@/server/dto/character";
import { countReadInSeries, countSeriesProgress } from "@/server/repositories/comics";
import { findDiscoveriesPage, findRecentDiscoveries } from "@/server/repositories/discoveries";
import {
  countByStatus,
  findActiveSeriesIds,
  findNewIssues,
  findReadDates,
  findRecentHistory,
  findSeriesIssues,
} from "@/server/repositories/library";
import { countCompletedSeries } from "@/server/repositories/achievements";
import { monthlyCounts, nextIssue, weeklyStreak } from "@/server/domain/reading-stats";
import type { ReadingStatus } from "@/server/domain/library-status";
import type { PageInput } from "@/server/validation/discoveries";
import { getUniverse } from "@/server/services/discovery";
import { listLibrary, toStatusCounts } from "@/server/services/library";

export interface DiscoveryDto {
  character: CharacterSummaryDto;
  viaComic: { id: string; title: string } | null;
  discoveredAt: string;
  /** Descubierto en las últimas 24 h: lleva la nota «¡nuevo!». */
  isNew: boolean;
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
  isNew: Date.now() - row.createdAt.getTime() < 24 * 60 * 60 * 1000,
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

export interface NextIssueDto {
  comic: { id: string; title: string; coverThumbUrl: string | null };
  series: { id: string; name: string };
  read: number;
  total: number;
}

/** «Qué leer ahora»: el siguiente número de cada serie que llevas a medias. */
export async function getNextIssues(db: PrismaClient, userId: string, limit: number, zone?: Zone) {
  const seriesIds = await findActiveSeriesIds(db, userId, limit * 2, zone);
  const issues = await findSeriesIssues(db, userId, seriesIds);
  const result: NextIssueDto[] = [];
  for (const seriesId of seriesIds) {
    const own = issues.filter((i) => i.seriesId === seriesId);
    const readIds = new Set(own.filter((i) => i.userEntries[0]?.status === "READ").map((i) => i.id));
    const next = nextIssue(own, readIds);
    if (!next) continue;
    result.push({
      comic: { id: next.id, title: next.title, coverThumbUrl: next.coverThumbUrl },
      series: { id: seriesId, name: next.series.name },
      read: readIds.size,
      total: own.length,
    });
  }
  return result.slice(0, limit);
}

export interface NewIssuesDto {
  series: { id: string; name: string };
  count: number;
  latest: { id: string; title: string; coverThumbUrl: string | null };
}

/** Números salidos en el último mes de las series que sigues, agrupados por serie. */
export async function getNewIssues(db: PrismaClient, userId: string, zone?: Zone) {
  const rows = await findNewIssues(db, userId, new Date(Date.now() - 30 * 86_400_000), zone);
  const groups = new Map<string, NewIssuesDto>();
  for (const { series, ...comic } of rows) {
    const group = groups.get(series.id) ?? { series, count: 0, latest: comic };
    group.count += 1;
    groups.set(series.id, group);
  }
  return [...groups.values()];
}

/** Estadísticas de lectura: por mes, racha, series completas y personajes más leídos. */
export async function getReadingStats(db: PrismaClient, userId: string, zone?: Zone) {
  const [dates, completedSeries, universe] = await Promise.all([
    findReadDates(db, userId, zone),
    countCompletedSeries(db, userId, zone),
    getUniverse(db, userId, zone),
  ]);
  // Solo personajes desbloqueados (aparecen en algo que has leído): nada de spoilers.
  const topCharacters = [...universe.cards]
    .sort((a, b) => b.comicsRead - a.comicsRead || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map((c) => ({ id: c.id, name: c.name, imageThumbUrl: c.imageThumbUrl, comicsRead: c.comicsRead }));
  return {
    read: dates.length,
    months: monthlyCounts(dates),
    streak: weeklyStreak(dates),
    completedSeries,
    topCharacters,
  };
}

/** Todo lo que necesita la portada privada. */
export async function getDashboard(db: PrismaClient, userId: string, zone?: Zone) {
  // Solo lo que estás leyendo y lo ya leído: los pendientes y abandonados no salen en el Inicio.
  const [stats, reading, read, recentDiscoveries, activity, nextIssues, newIssues] = await Promise.all([
    getDashboardStats(db, userId, zone),
    listLibrary(db, userId, { status: "READING", page: 1, pageSize: 1 }, zone),
    listLibrary(db, userId, { status: "READ", page: 1, pageSize: 6 }, zone),
    getRecentDiscoveries(db, userId, 6, zone),
    getRecentActivity(db, userId, 8, zone),
    getNextIssues(db, userId, 6, zone),
    getNewIssues(db, userId, zone),
  ]);
  const recentComics = [...reading.items, ...read.items].slice(0, 6);
  // Lo que estás leyendo (o lo último leído) y cuánto llevas de su serie.
  const hero = recentComics[0];
  const heroSeries = hero
    ? { name: hero.comic.series.name, ...(await countReadInSeries(db, userId, hero.comic.series.id)) }
    : null;
  return { stats, recentComics, hero, heroSeries, recentDiscoveries, activity, nextIssues, newIssues };
}
