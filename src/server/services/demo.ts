import type { PrismaClient } from "../../../generated/prisma/client";
import { DEMO_EMAIL_DOMAIN, DEMO_TTL_MS } from "@/lib/demo";
import { ZONES } from "@/lib/zones";
import { syncAchievements } from "@/server/services/achievements";
import { setComicsStatus } from "@/server/services/library";

// Cuántos cómics salen ya leídos en una cuenta de demo, por editorial.
const DEMO_READS = { marvel: 12, dc: 6 } as const;

/**
 * Prepara una cuenta de demo recién creada: perfil privado (no sale en Comunidad) y unos cómics
 * ya leídos de cada editorial, para que la colección y el universo no empiecen vacíos.
 * Solo usa cómics con sus personajes ya sincronizados: no gasta cuota de Comic Vine.
 */
export async function seedDemoAccount(db: PrismaClient, userId: string) {
  await db.user.update({ where: { id: userId }, data: { isPublic: false } });

  const comicIds: string[] = [];
  for (const [zone, take] of Object.entries(DEMO_READS)) {
    const comics = await db.comic.findMany({
      where: {
        charactersSyncedAt: { not: null },
        // Con la ficha de todos sus personajes ya traída (con su imagen, si Comic Vine la tiene).
        characters: {
          some: { character: { isCollectible: true } },
          every: { character: { detailsSyncedAt: { not: null } } },
        },
        series: { publisher: { slug: ZONES[zone as keyof typeof ZONES].publisherSlug } },
      },
      orderBy: [{ releaseDate: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take,
      select: { id: true },
    });
    comicIds.push(...comics.map((c) => c.id));
  }

  if (comicIds.length) await setComicsStatus(db, userId, comicIds, "READ");
  await syncAchievements(db, userId);
}

/** Borra las cuentas de demo con más de 24 h (todo lo suyo se borra en cascada). */
export function purgeExpiredDemos(db: PrismaClient, now = Date.now()) {
  return db.user.deleteMany({
    where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` }, createdAt: { lt: new Date(now - DEMO_TTL_MS) } },
  });
}
