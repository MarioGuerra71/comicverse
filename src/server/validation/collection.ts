import { z } from "zod";

export const collectionSearchSchema = z.object({
  filter: z.enum(["all", "favorites", "discovered", "collected"]).default("all"),
  sort: z.enum(["number", "name", "comics"]).default("number"),
});

export type CollectionSearchInput = z.infer<typeof collectionSearchSchema>;

export const favoriteSchema = z.object({ isFavorite: z.boolean() });
