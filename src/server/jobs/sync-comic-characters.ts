import type { PrismaClient } from "../../../generated/prisma/client";
import type { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import { SOURCE } from "@/server/jobs/import-volume";

interface CvIssueCredits {
  character_credits: { id: number; name: string }[] | null;
}

/**
 * Trae de Comic Vine la lista de personajes de un cómic (una petición) y la enlaza.
 * Los personajes nuevos se crean solo con su nombre; su ficha completa se completa aparte.
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
      data: credits.map((c) => ({ source: SOURCE, externalId: String(c.id), name: c.name.trim() })),
      skipDuplicates: true,
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
