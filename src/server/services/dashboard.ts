import type { PrismaClient } from "../../../generated/prisma/client";
import { countSeriesProgress } from "@/server/repositories/comics";
import { countByStatus } from "@/server/repositories/library";
import { getCollection } from "@/server/services/discovery";
import { toStatusCounts } from "@/server/services/library";

/** Progreso del universo para el dashboard (todo calculado de nuestros datos). */
export async function getDashboardStats(db: PrismaClient, userId: string) {
  const [grouped, collection, series] = await Promise.all([
    countByStatus(db, userId),
    getCollection(db, userId),
    countSeriesProgress(db, userId),
  ]);
  const library = toStatusCounts(grouped);
  return {
    library: { ...library, total: Object.values(library).reduce((a, b) => a + b, 0) },
    characters: collection.progress,
    relationships: collection.relationships,
    series,
  };
}
