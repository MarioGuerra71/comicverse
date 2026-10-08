import type { PrismaClient } from "../../../generated/prisma/client";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import {
  cleanRealName,
  htmlToText,
  pickImageUrls,
} from "@/server/integrations/comic-sources/comicvine/mappers";
import type { CvCharacterDetail } from "@/server/integrations/comic-sources/comicvine/types";
import { ensurePublisher, importVolume, SOURCE } from "@/server/jobs/import-volume";

const CHARACTER_FIELDS =
  "id,name,real_name,deck,publisher,image,count_of_issue_appearances,first_appeared_in_issue,issue_credits";

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

export async function importUniverse({
  db,
  client,
  universe,
  log = console.log,
}: ImportOptions): Promise<ImportSummary> {
  const publisherCache = new Map<string, string>();

  // ---------- 1 y 2. Series y sus cómics ----------
  log("1/4 Series y 2/4 Cómics");
  const seriesRows: { internalId: string; label: string }[] = [];
  for (const entry of universe.series) {
    const { seriesId, label, comics } = await importVolume(db, client, entry.id, publisherCache);
    seriesRows.push({ internalId: seriesId, label });
    log(`  ${label}: ${comics} cómics`);
  }

  // ---------- 3. Personajes ----------
  log("3/4 Personajes");
  const characterRows: {
    internalId: string;
    name: string;
    appearances: number | null;
    issueExternalIds: Set<string>;
  }[] = [];

  for (const [index, entry] of universe.characters.entries()) {
    const { results: c } = await client.get<CvCharacterDetail>(
      `character/4005-${entry.id}`,
      { field_list: CHARACTER_FIELDS },
    );

    const publisherId = await ensurePublisher(db, publisherCache, c.publisher);
    const images = pickImageUrls(c.image);
    const externalId = String(c.id);
    const name = c.name.trim();
    const data = {
      publisherId,
      name,
      // Nombre de la carta: el label curado de universe.json, o el de Comic Vine.
      displayName: entry.label?.trim() || name,
      catalogNumber: index + 1,
      realName: cleanRealName(c.real_name, name),
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