import { z } from "zod";

export const comicSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
  seriesId: z.uuid().optional(),
  // Zona (editorial). Las páginas la toman de la cookie; la API la acepta como ?publisher=.
  publisher: z.enum(["marvel", "dc"]).optional(),
  sort: z.enum(["release_desc", "release_asc", "title"]).default("release_desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export type ComicSearchInput = z.infer<typeof comicSearchSchema>;
export type ComicSort = ComicSearchInput["sort"];