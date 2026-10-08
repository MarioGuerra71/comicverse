import type { PrismaClient } from "../../../generated/prisma/client";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import {
  buildComicTitle,
  htmlToText,
  pickImageUrls,
  pickReleaseDate,
  slugify,
} from "@/server/integrations/comic-sources/comicvine/mappers";
import type {
  CvIssueSummary,
  CvPublisherRef,
  CvVolume,
} from "@/server/integrations/comic-sources/comicvine/types";

export const SOURCE = "COMICVINE" as const;
const VOLUME_FIELDS = "id,name,start_year,publisher";
const ISSUE_FIELDS = "id,name,issue_number,cover_date,store_date,image,description";

function parseYear(value: string | number | null): number | null {
  const year =
    typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isFinite(year) ? year : null;
}

export async function ensurePublisher(
  db: PrismaClient,
  cache: Map<string, string>,
  ref: CvPublisherRef | null,
): Promise<string> {
  const name = ref?.name?.trim() || "Unknown";
  const slug = slugify(name) || "unknown";

  const cached = cache.get(slug);
  if (cached) return cached;

  const publisher = await db.publisher.upsert({
    where: { slug },
    create: { name, slug },
    update: { name },
  });
  cache.set(slug, publisher.id);
  return publisher.id;
}

/** Lee una serie (volume) de Comic Vine. */
export async function fetchVolume(client: ComicVineClient, volumeId: number) {
  const { results } = await client.get<CvVolume>(`volume/4050-${volumeId}`, {
    field_list: VOLUME_FIELDS,
  });
  return results;
}

/**
 * Importa (o actualiza) una serie y todos sus cómics. Idempotente: upsert por id de Comic Vine.
 * Los personajes de cada cómic no vienen en el listado; se traen aparte.
 */
export async function importVolume(
  db: PrismaClient,
  client: ComicVineClient,
  volumeId: number,
  publisherCache = new Map<string, string>(),
  volume?: CvVolume,
) {
  const v = volume ?? (await fetchVolume(client, volumeId));
  const publisherId = await ensurePublisher(db, publisherCache, v.publisher);
  const startYear = parseYear(v.start_year);
  const externalId = String(v.id);
  const name = v.name.trim();

  const series = await db.series.upsert({
    where: { source_externalId: { source: SOURCE, externalId } },
    create: { publisherId, name, startYear, source: SOURCE, externalId },
    update: { publisherId, name, startYear, syncedAt: new Date() },
  });

  let comics = 0;
  for await (const page of client.paginate<CvIssueSummary>("issues", {
    filter: `volume:${externalId}`,
    sort: "cover_date:asc",
    field_list: ISSUE_FIELDS,
  })) {
    for (const issue of page) {
      const images = pickImageUrls(issue.image);
      const issueId = String(issue.id);
      const data = {
        issueNumber: issue.issue_number?.trim() || null,
        title: buildComicTitle(name, issue.issue_number),
        storyTitle: issue.name?.trim() || null,
        description: htmlToText(issue.description),
        releaseDate: pickReleaseDate(issue.store_date, issue.cover_date),
        coverUrl: images.url,
        coverThumbUrl: images.thumbUrl,
      };
      await db.comic.upsert({
        where: { source_externalId: { source: SOURCE, externalId: issueId } },
        create: { seriesId: series.id, source: SOURCE, externalId: issueId, ...data },
        update: { seriesId: series.id, ...data, syncedAt: new Date() },
      });
      comics++;
    }
  }

  return { seriesId: series.id, label: startYear ? `${name} (${startYear})` : name, comics };
}
