import type { PrismaClient } from "../../../generated/prisma/client";
import { ZONES, type Zone } from "@/lib/zones";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import { pickImageUrls } from "@/server/integrations/comic-sources/comicvine/mappers";
import type { CvVolumeSearchResult } from "@/server/integrations/comic-sources/comicvine/types";
import { fetchVolume, importVolume, SOURCE } from "@/server/jobs/import-volume";

const SEARCH_FIELDS = "id,name,start_year,publisher,count_of_issues,image";

export interface RemoteSeriesDto {
  externalId: number;
  name: string;
  startYear: string | null;
  issueCount: number;
  coverThumbUrl: string | null;
  /** Id de la serie en nuestro catálogo si ya se importó. */
  seriesId: string | null;
}

export class WrongPublisherError extends Error {}

/** Solo las series de la editorial de la zona (Comic Vine mezcla ediciones de otros países). */
export function toRemoteSeries(
  results: CvVolumeSearchResult[],
  zone: Zone,
  imported: Map<string, string>,
): RemoteSeriesDto[] {
  return results
    .filter((v) => v.publisher?.id === ZONES[zone].comicVineId && (v.count_of_issues ?? 0) > 0)
    .map((v) => ({
      externalId: v.id,
      name: v.name.trim(),
      startYear: v.start_year ? String(v.start_year) : null,
      issueCount: v.count_of_issues ?? 0,
      coverThumbUrl: pickImageUrls(v.image).thumbUrl,
      seriesId: imported.get(String(v.id)) ?? null,
    }));
}

/** Busca series en Comic Vine (una petición) y marca las que ya están en el catálogo. */
export async function searchRemoteSeries(
  db: PrismaClient,
  client: ComicVineClient,
  zone: Zone,
  query: string,
) {
  const { results } = await client.get<CvVolumeSearchResult[]>("search", {
    query,
    resources: "volume",
    limit: 20,
    field_list: SEARCH_FIELDS,
  });
  const existing = await db.series.findMany({
    where: { source: SOURCE, externalId: { in: results.map((r) => String(r.id)) } },
    select: { id: true, externalId: true },
  });
  return toRemoteSeries(results, zone, new Map(existing.map((s) => [s.externalId, s.id])));
}

/** Añade al catálogo una serie de Comic Vine con todos sus cómics, si es de la editorial de la zona. */
export async function importRemoteSeries(
  db: PrismaClient,
  client: ComicVineClient,
  zone: Zone,
  externalId: number,
) {
  const volume = await fetchVolume(client, externalId);
  if (volume.publisher?.id !== ZONES[zone].comicVineId) throw new WrongPublisherError();
  return importVolume(db, client, externalId, undefined, volume);
}
