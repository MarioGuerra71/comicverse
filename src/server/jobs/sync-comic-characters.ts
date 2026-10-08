import type { PrismaClient } from "../../../generated/prisma/client";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import type { CvCharacterDetail } from "@/server/integrations/comic-sources/comicvine/types";
import {
  CHARACTER_DETAIL_FIELDS,
  characterDetailData,
  ensurePublisher,
  SOURCE,
} from "@/server/jobs/import-volume";

/** Máximo de fichas que se completan al marcar un cómic como leído (cada una, ~1 s). */
const MAX_DETAILS_PER_READ = 12;

interface CvIssueCredits {
  character_credits: { id: number; name: string }[] | null;
}

/**
 * Trae de Comic Vine la lista de personajes de un cómic (una petición) y la enlaza.
 * Todo personaje que aparece en un cómic es coleccionable (decisión del usuario: la colección
 * crece con lo que lees). Los nuevos se crean solo con su nombre; la ficha se completa aparte.
 */
export async function syncComicCharacters(
  db: PrismaClient,
  client: ComicVineClient,
  comic: { id: string; externalId: string },
) {
  const { results } = await client.get<CvIssueCredits>(`issue/4000-${comic.externalId}`, {
    field_list: "character_credits",
  });
  const credits = results.character_credits ?? [];
  const externalIds = credits.map((c) => String(c.id));

  await db.$transaction(async (tx) => {
    await tx.character.createMany({
      data: credits.map((c) => ({
        source: SOURCE,
        externalId: String(c.id),
        name: c.name.trim(),
        isCollectible: true,
      })),
      skipDuplicates: true,
    });
    // Los que ya existían (por ejemplo, de otro cómic) también pasan a ser coleccionables.
    await tx.character.updateMany({
      where: { source: SOURCE, externalId: { in: externalIds }, isCollectible: false },
      data: { isCollectible: true },
    });
    const characters = await tx.character.findMany({
      where: { source: SOURCE, externalId: { in: externalIds } },
      select: { id: true },
    });
    await tx.comicCharacter.createMany({
      data: characters.map((c) => ({ comicId: comic.id, characterId: c.id })),
      skipDuplicates: true,
    });
    await tx.comic.update({ where: { id: comic.id }, data: { charactersSyncedAt: new Date() } });
  });

  return credits.length;
}

/**
 * Se asegura de que un cómic tiene sus personajes antes de mostrarlo o marcarlo como leído.
 * Si Comic Vine falla o no hay clave, sigue con lo que haya: se reintentará la próxima vez.
 */
export async function ensureComicCharacters(
  db: PrismaClient,
  client: ComicVineClient | null,
  comicId: string,
) {
  if (!client) return;
  const comic = await db.comic.findUnique({
    where: { id: comicId },
    select: { id: true, externalId: true, source: true, charactersSyncedAt: true },
  });
  if (!comic || comic.charactersSyncedAt || comic.source !== SOURCE) return;
  try {
    await syncComicCharacters(db, client, comic);
  } catch (error) {
    console.error("No se pudieron traer los personajes del cómic", comicId, error);
  }
}

/**
 * Completa la ficha (imagen, nombre real, resumen, editorial) de los personajes de un cómic que
 * aún no la tienen. Se llama al marcarlo como leído: son los que están a punto de desbloquearse.
 */
export async function ensureCharacterDetails(
  db: PrismaClient,
  client: ComicVineClient | null,
  comicId: string,
) {
  if (!client) return;
  const pending = await db.character.findMany({
    where: { source: SOURCE, detailsSyncedAt: null, comics: { some: { comicId } } },
    select: { id: true, externalId: true },
    take: MAX_DETAILS_PER_READ,
  });
  const publisherCache = new Map<string, string>();
  for (const character of pending) {
    try {
      const { results } = await client.get<CvCharacterDetail>(`character/4005-${character.externalId}`, {
        field_list: CHARACTER_DETAIL_FIELDS,
      });
      const publisherId = await ensurePublisher(db, publisherCache, results.publisher);
      await db.character.update({
        where: { id: character.id },
        data: characterDetailData(results, publisherId),
      });
    } catch (error) {
      // Sin ficha la carta sale sin imagen; se volverá a intentar en la próxima lectura.
      console.error("No se pudo completar la ficha del personaje", character.id, error);
    }
  }
}
