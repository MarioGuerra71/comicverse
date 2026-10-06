import { z } from "zod";

export const readingStatusSchema = z.enum([
  "PENDING",
  "READING",
  "READ",
  "DROPPED",
]);

export const comicIdSchema = z.uuid();

export const setStatusSchema = z.object({
  status: readingStatusSchema,
});

export const librarySearchSchema = z.object({
  status: readingStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export type LibrarySearchInput = z.infer<typeof librarySearchSchema>;

// PATCH: puntuación (1–5, null para quitarla) y/o favorito. Al menos uno de los dos.
export const updateEntrySchema = z
  .object({
    rating: z.int().min(1).max(5).nullable().optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((data) => data.rating !== undefined || data.isFavorite !== undefined, {
    message: "Indica rating o isFavorite",
  });

export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
