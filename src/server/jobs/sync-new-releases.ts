import type { PrismaClient } from "../../../generated/prisma/client";
import { ZONES } from "@/lib/zones";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import type { CvIssueSummary, CvVolume } from "@/server/integrations/comic-sources/comicvine/types";
import {
  importVolume,
  ISSUE_FIELDS,
  SOURCE,
  upsertComic,
  VOLUME_FIELDS,
} from "@/server/jobs/import-volume";

type ReleaseIssue = CvIssueSummary & { volume: { id: number } | null };

const ZONE_SLUGS = new Set<string>(Object.values(ZONES).map((z) => z.publisherSlug));
const ZONE_CV_IDS = new Set<number>(Object.values(ZONES).map((z) => z.comicVineId));

const day = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Novedades: los cómics publicados en los últimos `days` días. De las series que ya tenemos se
 * guardan esos números; las series nuevas de Marvel o DC se añaden enteras; las de otras
 * editoriales se ignoran.
 */
export async function syncNewReleases(
  db: PrismaClient,
  client: ComicVineClient,
  { days = 3, now = new Date() }: { days?: number; now?: Date } = {},
) {
  const from = new Date(now.getTime() - days * 86_400_000);
  const byVolume = new Map<number, ReleaseIssue[]>();
  for await (const page of client.paginate<ReleaseIssue>("issues", {
    filter: `store_date:${day(from)}|${day(now)}`,
    sort: "store_date:desc",
    field_list: `${ISSUE_FIELDS},volume`,
  })) {
    for (const issue of page) {
      if (!issue.volume) continue;
      byVolume.set(issue.volume.id, [...(byVolume.get(issue.volume.id) ?? []), issue]);
    }
  }

  const summary = { issues: 0, comics: 0, newSeries: [] as string[] };
  const unknown: number[] = [];
  for (const [volumeId, issues] of byVolume) {
    summary.issues += issues.length;
    const series = await db.series.findUnique({
      where: { source_externalId: { source: SOURCE, externalId: String(volumeId) } },
      select: { id: true, name: true, publisher: { select: { slug: true } } },
    });
    if (!series) {
      unknown.push(volumeId);
      continue;
    }
    if (!ZONE_SLUGS.has(series.publisher.slug)) continue;
    for (const issue of issues) await upsertComic(db, series, issue);
    summary.comics += issues.length;
  }

  // Series que no tenemos: su editorial, en tandas de 100 por petición. Las de Marvel o DC, enteras.
  const publisherCache = new Map<string, string>();
  for (let i = 0; i < unknown.length; i += 100) {
    const ids = unknown.slice(i, i + 100);
    const { results } = await client.get<CvVolume[]>("volumes", {
      filter: `id:${ids.join("|")}`,
      field_list: VOLUME_FIELDS,
      limit: 100,
    });
    for (const volume of results) {
      if (!volume.publisher || !ZONE_CV_IDS.has(volume.publisher.id)) continue;
      const imported = await importVolume(db, client, volume.id, publisherCache, volume);
      summary.comics += imported.comics;
      summary.newSeries.push(imported.label);
    }
  }
  return summary;
}
