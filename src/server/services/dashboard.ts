import type { Zone } from "@/lib/zones";
import type { PrismaClient } from "../../../generated/prisma/client";
import { toCharacterSummary, type CharacterSummaryDto } from "@/server/dto/character";
import { countSeriesProgress } from "@/server/repositories/comics";
import { findDiscoveriesPage, findRecentDiscoveries } from "@/server/repositories/discoveries";
import {
  countByStatus,
  findActiveSeriesIds,
  findNewIssues,
  findReadDates,
  findSeriesIssues,
} from "@/server/repositories/library";
import { countCompletedSeries } from "@/server/repositories/achievements";
import {
  currentWeek,
  issueWindow,
  nextIssue,
  readingTimeline,
  weeklyStreak,
  type TimelineView,
} from "@/server/domain/reading-stats";
import { sortIssues } from "@/server/domain/series-order";
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

/** Estadísticas de lectura: por día, semana o mes, racha, series completas y personajes más leídos. */
export async function getReadingStats(db: PrismaClient, userId: string, zone?: Zone, view: TimelineView = "day") {
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
    timeline: readingTimeline(dates, view),
    lastYear: readingTimeline(dates, "month").reduce((sum, m) => sum + m.count, 0),
    streak: weeklyStreak(dates),
    completedSeries,
    topCharacters,
  };
}

/** La caja de luz: progreso en la serie del cómic que tienes entre manos y la tira de sus números. */
async function getHeroSeries(db: PrismaClient, userId: string, seriesId: string, name: string, comicId: string) {
  const issues = sortIssues(await findSeriesIssues(db, userId, [seriesId]));
  const isRead = (i: (typeof issues)[number]) => i.userEntries[0]?.status === "READ";
  const { start, items } = issueWindow(issues, comicId);
  return {
    name,
    read: issues.filter(isRead).length,
    total: issues.length,
    strip: {
      start,
      items: items.map((i) => ({ id: i.id, title: i.title, read: isRead(i), current: i.id === comicId })),
    },
  };
}

/** Tu semana para el Inicio: lecturas de lunes a domingo, racha y total del mes. */
async function getWeekSummary(db: PrismaClient, userId: string, zone?: Zone) {
  const dates = await findReadDates(db, userId, zone);
  return {
    days: currentWeek(dates),
    streak: weeklyStreak(dates),
    thisMonth: readingTimeline(dates, "month").at(-1)?.count ?? 0,
  };
}

/** Todo lo que necesita la portada privada. */
export async function getDashboard(db: PrismaClient, userId: string, zone?: Zone) {
  // Solo lo que estás leyendo y lo ya leído: los pendientes y abandonados no salen en el Inicio.
  const [stats, reading, read, recentDiscoveries, nextIssues, newIssues, week] = await Promise.all([
    getDashboardStats(db, userId, zone),
    listLibrary(db, userId, { status: "READING", page: 1, pageSize: 1 }, zone),
    listLibrary(db, userId, { status: "READ", page: 1, pageSize: 6 }, zone),
    getRecentDiscoveries(db, userId, 6, zone),
    getNextIssues(db, userId, 7, zone),
    getNewIssues(db, userId, zone),
    getWeekSummary(db, userId, zone),
  ]);
  const recentComics = [...reading.items, ...read.items].slice(0, 6);
  // Lo que estás leyendo (o lo último leído), su serie y el número siguiente (que va dentro de la caja).
  const hero = recentComics[0];
  const heroSeries = hero
    ? await getHeroSeries(db, userId, hero.comic.series.id, hero.comic.series.name, hero.comic.id)
    : null;
  const heroNext = hero ? (nextIssues.find((n) => n.series.id === hero.comic.series.id) ?? null) : null;
  return {
    stats,
    recentComics,
    hero,
    heroSeries,
    heroNext,
    recentDiscoveries,
    nextIssues: nextIssues.filter((n) => n !== heroNext).slice(0, 6),
    newIssues,
    week,
  };
}
