import { z } from "zod";

export const collectionSearchSchema = z.object({
  filter: z.enum(["all", "favorites", "discovered", "collected"]).default("all"),
  sort: z.enum(["number", "name", "comics"]).default("number"),
});

export type CollectionSearchInput = z.infer<typeof collectionSearchSchema>;

export const favoriteSchema = z.object({ isFavorite: z.boolean() });

// Solo imágenes de Comic Vine: es el único dominio de imágenes que permite la CSP (img-src).
export const comicVineImageSchema = z
  .url()
  .refine((url) => url.startsWith("https://comicvine.gamespot.com/"), "Debe ser una imagen de comicvine.gamespot.com");

// Imagen de una versión: cualquier enlace HTTPS (solo la ve quien la elige). Sin http: (contenido
// mixto) ni javascript:/data:, y con un tope de longitud.
export const versionImageSchema = z.object({
  imageUrl: z.url({ protocol: /^https$/ }).max(2000),
});
