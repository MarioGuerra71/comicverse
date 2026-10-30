import type { PrismaClient } from "../../../generated/prisma/client";
import { ZONES, type Zone } from "@/lib/zones";

/** Cómics leídos por el usuario (de una editorial, si se indica). */
export function countRead(db: PrismaClient, userId: string, zone?: Zone) {
  return db.userComic.count({
    where: {
      userId,
      status: "READ",
      ...(zone ? { comic: { series: { publisher: { slug: ZONES[zone].publisherSlug } } } } : {}),
    },
  });
}

/** Décadas distintas (por fecha de salida) de los cómics leídos. */
export async function countReadDecades(db: PrismaClient, userId: string) {
  const [row] = await db.$queryRaw<{ decades: bigint }[]>`
    SELECT COUNT(DISTINCT FLOOR(EXTRACT(YEAR FROM c."releaseDate") / 10)) AS decades
    FROM "UserComic" uc JOIN "Comic" c ON c.id = uc."comicId"
    WHERE uc."userId" = ${userId} AND uc.status = 'READ' AND c."releaseDate" IS NOT NULL
  `;
  return Number(row?.decades ?? 0);
}

export function findEarnedAchievements(db: PrismaClient, userId: string) {
  return db.userAchievement.findMany({ where: { userId }, select: { achievementId: true, earnedAt: true } });
}

export function saveEarnedAchievements(db: PrismaClient, userId: string, ids: string[]) {
  return db.userAchievement.createMany({
    data: ids.map((achievementId) => ({ userId, achievementId })),
    skipDuplicates: true,
  });
}

/** Un one-shot no cuenta como «serie completa»: hace falta al menos este número de cómics. */
export const MIN_SERIES_SIZE = 4;

/** Series que has leído enteras (de una editorial, si se indica). */
export async function countCompletedSeries(db: PrismaClient, userId: string, zone?: Zone) {
  const slug = zone ? ZONES[zone].publisherSlug : null;
  const [row] = await db.$queryRaw<{ completed: bigint }[]>`
    SELECT COUNT(*) AS completed FROM (
      SELECT c."seriesId"
      FROM "Comic" c
      JOIN "Series" s ON s.id = c."seriesId"
      JOIN "Publisher" p ON p.id = s."publisherId"
      LEFT JOIN "UserComic" uc ON uc."comicId" = c.id AND uc."userId" = ${userId} AND uc.status = 'READ'
      WHERE (${slug}::text IS NULL OR p.slug = ${slug})
        AND c."seriesId" IN (
          SELECT c2."seriesId" FROM "UserComic" u2 JOIN "Comic" c2 ON c2.id = u2."comicId"
          WHERE u2."userId" = ${userId} AND u2.status = 'READ'
        )
      GROUP BY c."seriesId"
      HAVING COUNT(*) >= ${MIN_SERIES_SIZE} AND COUNT(*) = COUNT(uc."comicId")
    ) done
  `;
  return Number(row?.completed ?? 0);
}
