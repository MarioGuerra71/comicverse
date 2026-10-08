import { z } from "zod";

export const importSeriesSchema = z.object({
  externalId: z.number().int().positive(),
  publisher: z.enum(["marvel", "dc"]),
});
