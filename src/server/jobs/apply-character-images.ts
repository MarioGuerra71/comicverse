import { z } from "zod";
import type { PrismaClient } from "../../../generated/prisma/client";

// Solo imágenes de Comic Vine: es el único dominio de imágenes que permite la CSP (img-src).
const comicVineImage = z
  .url()
  .refine((url) => url.startsWith("https://comicvine.gamespot.com/"), "Debe ser una imagen de comicvine.gamespot.com");

const fileSchema = z.object({
  images: z.array(
    z.object({
      comicVineId: z.number().int().positive(),
      imageUrl: comicVineImage,
      note: z.string().optional(),
    }),
  ),
});

/**
 * Aplica data/character-images.json: la imagen elegida a mano sustituye a la de Comic Vine.
 * Todo o nada: si un personaje no existe, lanza un error y no cambia ninguna imagen.
 */
export async function applyCharacterImages(db: PrismaClient, file: unknown) {
  const { images } = fileSchema.parse(file);
  const externalIds = images.map((i) => String(i.comicVineId));
  const found = await db.character.findMany({
    where: { source: "COMICVINE", externalId: { in: externalIds } },
    select: { externalId: true },
  });
  const missing = externalIds.filter((id) => !found.some((c) => c.externalId === id));
  if (missing.length > 0) {
    throw new Error(`Personajes que no están en la base de datos (ids de Comic Vine): ${missing.join(", ")}`);
  }

  await db.$transaction(
    images.map((i) =>
      db.character.update({
        where: { source_externalId: { source: "COMICVINE", externalId: String(i.comicVineId) } },
        data: { imageUrl: i.imageUrl, imageThumbUrl: i.imageUrl },
      }),
    ),
  );
  return images.length;
}
