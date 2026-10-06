import type { PrismaClient } from "../../../generated/prisma/client";
import { toCharacterSummary, type CharacterSummaryDto } from "@/server/dto/character";
import { findUnlockedCharacters } from "@/server/repositories/characters";
import { countSeriesProgress } from "@/server/repositories/comics";
import { findRecentDiscoveries } from "@/server/repositories/discoveries";
import { countByStatus } from "@/server/repositories/library";
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

/**
 * Últimos personajes descubiertos (uno por personaje, el descubrimiento más reciente).
 * Solo los que siguen desbloqueados: el registro es historia, pero un personaje que
 * ha vuelto a bloquearse no puede salir hacia el navegador.
 */
export async function getRecentDiscoveries(
  db: PrismaClient,
  userId: string,
  limit: number,
): Promise<DiscoveryDto[]> {
  // ponytail: mira las últimas 100 filas; con historiales enormes podría quedarse corto.
  const [rows, unlocked] = await Promise.all([
    findRecentDiscoveries(db, userId, 100),
    findUnlockedCharacters(db, userId),
  ]);
  const unlockedIds = new Set(unlocked.map((c) => c.id));
  const seen = new Set<string>();
  const result: DiscoveryDto[] = [];
  for (const row of rows) {
    if (!unlockedIds.has(row.character.id) || seen.has(row.character.id)) continue;
    seen.add(row.character.id);
    result.push({
      character: toCharacterSummary(row.character),
      viaComic: row.viaComic,
      discoveredAt: row.createdAt.toISOString(),
    });
    if (result.length === limit) break;
  }
  return result;
}

/** Todo lo que necesita la portada privada. */
export async function getDashboard(db: PrismaClient, userId: string) {
  const [stats, recentLibrary, recentDiscoveries] = await Promise.all([
    getDashboardStats(db, userId),
    listLibrary(db, userId, { page: 1, pageSize: 6 }),
    getRecentDiscoveries(db, userId, 6),
  ]);
  return { stats, recentComics: recentLibrary.items, recentDiscoveries };
}
