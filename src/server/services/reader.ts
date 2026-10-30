import type { PrismaClient } from "../../../generated/prisma/client";
import { ZONE_KEYS, ZONES } from "@/lib/zones";
import { parseComicFileName, seriesKey } from "@/lib/reader/filename";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import {
  chooseMatches,
  chooseRemoteVolume,
  lookupKeys,
  type MatchFile,
  type RemoteVolume,
} from "@/server/domain/reader-match";
import { findKnownSeriesKeys, findMatchCandidates, searchMatchCandidates } from "@/server/repositories/reader";
import { importVolume, SOURCE } from "@/server/jobs/import-volume";
import { toRemoteSeries } from "@/server/services/remote-catalog";
import type { CvVolumeSearchResult } from "@/server/integrations/comic-sources/comicvine/types";

/** Empareja archivos del lector con cómics del catálogo (en una tanda). */
export async function matchReaderFiles(db: PrismaClient, userId: string, files: MatchFile[]) {
  const { keys, issues } = lookupKeys(files);
  const [rows, known] = await Promise.all([
    findMatchCandidates(db, userId, keys, issues),
    findKnownSeriesKeys(db, keys),
  ]);
  return chooseMatches(files, rows, known);
}

/** Búsqueda manual desde el lector: «green lantern 21» encuentra «Green Lantern #21» de cada serie. */
export async function searchReaderCandidates(db: PrismaClient, userId: string, q: string) {
  const { series, issue } = parseComicFileName(q);
  const key = seriesKey(series);
  if (!key) return [];
  return searchMatchCandidates(db, userId, key, issue);
}

const PUBLISHER_IDS = new Set(Object.values(ZONES).map((z) => z.comicVineId));

/**
 * Trae de Comic Vine la serie de un archivo que el catálogo no tiene, si se sabe cuál es (mismo
 * nombre y editorial; con varias, la del año). Devuelve su nombre o null si no estaba clara.
 */
export async function importSeriesForFile(db: PrismaClient, client: ComicVineClient, file: { name: string; path: string }) {
  const parsed = parseComicFileName(file.name, file.path);
  const { results } = await client.get<RemoteVolume[]>("search", {
    query: parsed.series,
    resources: "volume",
    limit: 20,
    field_list: "id,name,start_year,publisher,count_of_issues",
  });
  const volume = chooseRemoteVolume(results, parsed, PUBLISHER_IDS);
  if (!volume) return null;
  const existing = await db.series.findUnique({
    where: { source_externalId: { source: SOURCE, externalId: String(volume.id) } },
    select: { name: true },
  });
  if (existing) return existing.name;
  const imported = await importVolume(db, client, volume.id);
  return imported.label;
}

/** Series de Comic Vine con ese nombre, de Marvel y de DC (una sola petición), para elegir a mano. */
export async function searchRemoteForReader(db: PrismaClient, client: ComicVineClient, q: string) {
  const { results } = await client.get<CvVolumeSearchResult[]>("search", {
    query: parseComicFileName(q).series,
    resources: "volume",
    limit: 20,
    field_list: "id,name,start_year,publisher,count_of_issues,image",
  });
  const existing = await db.series.findMany({
    where: { source: SOURCE, externalId: { in: results.map((r) => String(r.id)) } },
    select: { id: true, externalId: true },
  });
  const imported = new Map(existing.map((s) => [s.externalId, s.id]));
  return ZONE_KEYS.flatMap((zone) => toRemoteSeries(results, zone, imported).map((s) => ({ ...s, publisher: zone })));
}
