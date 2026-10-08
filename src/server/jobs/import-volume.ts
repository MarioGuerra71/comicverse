import type { PrismaClient } from "../../../generated/prisma/client";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import {
  buildComicTitle,
  cleanRealName,
  htmlToText,
  pickImageUrls,
  pickReleaseDate,
  slugify,
} from "@/server/integrations/comic-sources/comicvine/mappers";
import type {
  CvCharacterDetail,
  CvIssueSummary,
  CvPublisherRef,
  CvVolume,
} from "@/server/integrations/comic-sources/comicvine/types";

export const SOURCE = "COMICVINE" as const;
export const VOLUME_FIELDS = "id,name,start_year,publisher";
export const ISSUE_FIELDS = "id,name,issue_number,cover_date,store_date,image,description";

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

/** Guarda (o actualiza) un cómic de una serie ya guardada. */
export async function upsertComic(
  db: PrismaClient,
  series: { id: string; name: string },
  issue: CvIssueSummary,
) {
  const images = pickImageUrls(issue.image);
  const externalId = String(issue.id);
  const data = {
    issueNumber: issue.issue_number?.trim() || null,
    title: buildComicTitle(series.name, issue.issue_number),
    storyTitle: issue.name?.trim() || null,
    description: htmlToText(issue.description),
    releaseDate: pickReleaseDate(issue.store_date, issue.cover_date),
    coverUrl: images.url,
    coverThumbUrl: images.thumbUrl,
  };
  return db.comic.upsert({
    where: { source_externalId: { source: SOURCE, externalId } },
    create: { seriesId: series.id, source: SOURCE, externalId, ...data },
    update: { seriesId: series.id, ...data, syncedAt: new Date() },
  });
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
      await upsertComic(db, { id: series.id, name }, issue);
      comics++;
    }
  }

  return { seriesId: series.id, label: startYear ? `${name} (${startYear})` : name, comics };
}

export const CHARACTER_DETAIL_FIELDS =
  "id,name,real_name,deck,publisher,image,count_of_issue_appearances,first_appeared_in_issue";

/** Datos de la ficha de un personaje de Comic Vine, tal como se guardan. */
export function characterDetailData(c: CvCharacterDetail, publisherId: string) {
  const images = pickImageUrls(c.image);
  const name = c.name.trim();
  return {
    publisherId,
    name,
    realName: cleanRealName(c.real_name, name),
    summary: htmlToText(c.deck, 500),
    imageUrl: images.url,
    imageThumbUrl: images.thumbUrl,
    appearancesCount: c.count_of_issue_appearances ?? null,
    firstAppearanceExternalId: c.first_appeared_in_issue ? String(c.first_appeared_in_issue.id) : null,
    detailsSyncedAt: new Date(),
  };
}
