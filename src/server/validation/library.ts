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