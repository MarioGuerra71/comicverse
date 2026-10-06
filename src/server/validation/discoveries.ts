import { z } from "zod";

export const discoveriesSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export type PageInput = z.infer<typeof discoveriesSearchSchema>;
