import { z } from "zod";

const readerFile = z.object({
  key: z.string().min(1).max(64),
  name: z.string().min(1).max(300),
  path: z.string().max(500).default(""),
  seriesId: z.uuid().optional(),
});

// Emparejar una tanda de archivos, o buscar a mano con un texto («green lantern 21»).
export const readerMatchSchema = z.union([
  z.object({ files: z.array(readerFile).min(1).max(100) }),
  z.object({ q: z.string().trim().min(1).max(120) }),
]);

export const readerImportSchema = readerFile.pick({ name: true, path: true });
