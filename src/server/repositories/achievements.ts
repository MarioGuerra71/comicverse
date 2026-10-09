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
