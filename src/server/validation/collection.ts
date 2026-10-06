import { z } from "zod";

export const collectionSearchSchema = z.object({
  filter: z.enum(["all", "favorites", "discovered", "collected"]).default("all"),
  sort: z.enum(["name", "comics"]).default("name"),
});

export type CollectionSearchInput = z.infer<typeof collectionSearchSchema>;

export const favoriteSchema = z.object({ isFavorite: z.boolean() });
