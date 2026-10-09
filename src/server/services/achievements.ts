import type { PrismaClient } from "../../../generated/prisma/client";
import { ZONES, ZONE_KEYS, type Zone } from "@/lib/zones";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  MIN_ALBUM_SIZE,
  type AchievementGroup,
  type AchievementStats,
} from "@/server/domain/achievements";
import { toAlbums, toCollection } from "@/server/dto/character";
import {
  countRead,
  countReadDecades,
  findEarnedAchievements,
  saveEarnedAchievements,
} from "@/server/repositories/achievements";
import { findAlbumRows, findCollection } from "@/server/repositories/characters";

/** Estadísticas para los logros (lectura, colección, álbumes y editoriales). */
export async function getAchievementStats(db: PrismaClient, userId: string): Promise<AchievementStats> {
  const [read, decades, readMarvel, readDc, rows, ...albumRows] = await Promise.all([
    countRead(db, userId),
    countReadDecades(db, userId),
    countRead(db, userId, "marvel"),
    countRead(db, userId, "dc"),
    findCollection(db, userId),
    ...ZONE_KEYS.map((z) => findAlbumRows(db, userId, ZONES[z].publisherSlug)),
  ]);
  const { cards } = toCollection(rows);
  const unlocked = new Map(cards.map((c) => [c.id, c]));
  const perZone = albumRows.map((zoneRows) => {
    const ids = new Set(zoneRows.flatMap((r) => (r.characterId ? [r.characterId] : [])));
    return {
      unlocked: [...ids].filter((id) => unlocked.has(id)).length,
      albums: toAlbums(zoneRows, unlocked),
    };
  });
  const bestAlbumPercent = Math.max(
    0,
    ...perZone.flatMap((z) =>
      z.albums.filter((a) => a.total >= MIN_ALBUM_SIZE).map((a) => Math.floor((a.discovered * 100) / a.total)),
    ),
  );
  const zone = (key: Zone) => perZone[ZONE_KEYS.indexOf(key)];
  return {
    read,
    decades,
    readMarvel,
    readDc,
    unlocked: cards.length,
    collected: cards.filter((c) => c.state === "COLLECTED").length,
    bestAlbumPercent,
    zonesWithAlbums: perZone.filter((z) => z.albums.length > 0).length,
    unlockedMarvel: zone("marvel").unlocked,
    unlockedDc: zone("dc").unlocked,
  };
}

/** Guarda los logros que se acaban de cumplir y devuelve los nuevos (para animarlos). */
export async function syncAchievements(db: PrismaClient, userId: string) {
  const [stats, earned] = await Promise.all([getAchievementStats(db, userId), findEarnedAchievements(db, userId)]);
  const already = new Set(earned.map((e) => e.achievementId));
  const fresh = evaluateAchievements(stats)
    .filter((p) => p.done && !already.has(p.id))
    .map((p) => p.id);
  if (fresh.length > 0) await saveEarnedAchievements(db, userId, fresh);
  return ACHIEVEMENTS.filter((a) => fresh.includes(a.id)).map((a) => ({ id: a.id, title: a.title }));
}

export interface AchievementDto {
  id: string;
  group: AchievementGroup;
  /** Un secreto sin conseguir llega como «???»: ni su nombre ni su descripción salen. */
  title: string;
  description: string | null;
  secret: boolean;
  earnedAt: string | null;
  current: number | null;
  target: number | null;
}

/** Todos los logros con su progreso; los conseguidos con su fecha. */
export async function getAchievementsPage(db: PrismaClient, userId: string) {
  await syncAchievements(db, userId);
  const [stats, earned] = await Promise.all([getAchievementStats(db, userId), findEarnedAchievements(db, userId)]);
  const earnedAt = new Map(earned.map((e) => [e.achievementId, e.earnedAt.toISOString()]));
  const progress = new Map(evaluateAchievements(stats).map((p) => [p.id, p]));
  const items = ACHIEVEMENTS.map((a): AchievementDto => {
    const at = earnedAt.get(a.id) ?? null;
    const hidden = !!a.secret && !at;
    const p = progress.get(a.id)!;
    return {
      id: a.id,
      group: a.group,
      title: hidden ? "???" : a.title,
      description: hidden ? null : a.description,
      secret: !!a.secret,
      earnedAt: at,
      current: hidden ? null : p.current,
      target: hidden ? null : p.target,
    };
  });
  return { items, earned: earnedAt.size, total: ACHIEVEMENTS.length };
}
