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

const SOURCE = "COMICVINE" as const;
const VOLUME_FIELDS = "id,name,start_year,publisher";
const CHARACTER_FIELDS =
  "id,name,real_name,deck,publisher,image,count_of_issue_appearances,first_appeared_in_issue,issue_credits";
const ISSUE_FIELDS =
  "id,name,issue_number,cover_date,store_date,image,description";

export interface UniverseFile {
  series: { id: number; label?: string }[];
  characters: { id: number; label?: string }[];
}

export interface ImportSummary {
  series: number;
  comics: number;
  characters: number;
  links: number;
  perCharacter: {
    personaje: string;
    aparicionesEnComicVine: number | null;
    enNuestroCatalogo: number;
  }[];
}

interface ImportOptions {
  db: PrismaClient;
  client: ComicVineClient;
  universe: UniverseFile;
  log?: (message: string) => void;
}

function parseYear(value: string | number | null): number | null {
  const year =
    typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isFinite(year) ? year : null;
}

async function ensurePublisher(
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

export async function importUniverse({
  db,
  client,
  universe,
  log = console.log,
}: ImportOptions): Promise<ImportSummary> {
  const publisherCache = new Map<string, string>();

  // ---------- 1. Series ----------
  log("1/4 Series");
  const seriesRows: {
    internalId: string;
    externalId: string;
    name: string;
    label: string;
  }[] = [];

  for (const entry of universe.series) {
    const { results: volume } = await client.get<CvVolume>(
      `volume/4050-${entry.id}`,
      { field_list: VOLUME_FIELDS },
    );

    const publisherId = await ensurePublisher(db, publisherCache, volume.publisher);
    const startYear = parseYear(volume.start_year);
    const externalId = String(volume.id);
    const name = volume.name.trim();

    const series = await db.series.upsert({
      where: { source_externalId: { source: SOURCE, externalId } },
      create: { publisherId, name, startYear, source: SOURCE, externalId },
      update: { publisherId, name, startYear, syncedAt: new Date() },
    });

    const label = startYear ? `${name} (${startYear})` : name;
    seriesRows.push({ internalId: series.id, externalId, name, label });
    log(`  ${label}`);
  }

  // ---------- 2. Cómics de cada serie ----------
  log("2/4 Cómics");

  for (const s of seriesRows) {
    let count = 0;

    for await (const page of client.paginate<CvIssueSummary>("issues", {
      filter: `volume:${s.externalId}`,
      sort: "cover_date:asc",
      field_list: ISSUE_FIELDS,
    })) {
      for (const issue of page) {
        const images = pickImageUrls(issue.image);
        const externalId = String(issue.id);
        const data = {
          issueNumber: issue.issue_number?.trim() || null,
          title: buildComicTitle(s.name, issue.issue_number),
          storyTitle: issue.name?.trim() || null,
          description: htmlToText(issue.description),
          releaseDate: pickReleaseDate(issue.store_date, issue.cover_date),
          coverUrl: images.url,
          coverThumbUrl: images.thumbUrl,
        };

        await db.comic.upsert({
          where: { source_externalId: { source: SOURCE, externalId } },
          create: { seriesId: s.internalId, source: SOURCE, externalId, ...data },
          update: { seriesId: s.internalId, ...data, syncedAt: new Date() },
        });
        count++;
      }
      log(`  ${s.label}: ${count} cómics`);
    }
  }

  // ---------- 3. Personajes ----------
  log("3/4 Personajes");
  const characterRows: {
    internalId: string;
    name: string;
    appearances: number | null;
    issueExternalIds: Set<string>;
  }[] = [];

  for (const entry of universe.characters) {
    const { results: c } = await client.get<CvCharacterDetail>(
      `character/4005-${entry.id}`,
      { field_list: CHARACTER_FIELDS },
    );

    const publisherId = await ensurePublisher(db, publisherCache, c.publisher);
    const images = pickImageUrls(c.image);
    const externalId = String(c.id);
    const data = {
      publisherId,
      name: c.name.trim(),
      realName: cleanRealName(c.real_name),
      summary: htmlToText(c.deck, 500),
      imageUrl: images.url,
      imageThumbUrl: images.thumbUrl,
      appearancesCount: c.count_of_issue_appearances ?? null,
      firstAppearanceExternalId: c.first_appeared_in_issue
        ? String(c.first_appeared_in_issue.id)
        : null,
      isCollectible: true,
      detailsSyncedAt: new Date(),
    };

    const character = await db.character.upsert({
      where: { source_externalId: { source: SOURCE, externalId } },
      create: { source: SOURCE, externalId, ...data },
      update: { ...data, syncedAt: new Date() },
    });

    const issueExternalIds = new Set(
      (c.issue_credits ?? []).map((credit) => String(credit.id)),
    );
    characterRows.push({
      internalId: character.id,
      name: character.name,
      appearances: character.appearancesCount,
      issueExternalIds,
    });
    log(`  ${character.name} (${issueExternalIds.size} apariciones en Comic Vine)`);
  }

  // ---------- 4. Enlaces personaje-cómic ----------
  // Solo enlazamos con los cómics que tenemos importados.
  log("4/4 Enlaces personaje-cómic");
  const comics = await db.comic.findMany({
    where: {
      source: SOURCE,
      seriesId: { in: seriesRows.map((s) => s.internalId) },
    },
    select: { id: true, externalId: true },
  });
  const comicIdByExternalId = new Map(comics.map((c) => [c.externalId, c.id]));

  const perCharacter: ImportSummary["perCharacter"] = [];
  for (const row of characterRows) {
    const comicIds: string[] = [];
    for (const externalId of row.issueExternalIds) {
      const comicId = comicIdByExternalId.get(externalId);
      if (comicId) comicIds.push(comicId);
    }

    await db.comicCharacter.createMany({
      data: comicIds.map((comicId) => ({ comicId, characterId: row.internalId })),
      skipDuplicates: true,
    });

    perCharacter.push({
      personaje: row.name,
      aparicionesEnComicVine: row.appearances,
      enNuestroCatalogo: await db.comicCharacter.count({
        where: { characterId: row.internalId },
      }),
    });
  }

  return {
    series: seriesRows.length,
    comics: comics.length,
    characters: characterRows.length,
    links: await db.comicCharacter.count({
      where: { characterId: { in: characterRows.map((r) => r.internalId) } },
    }),
    perCharacter,
  };
}