import type { PrismaClient } from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";
import { ZONES, ZONE_KEYS, type Zone } from "@/lib/zones";
import { findAlbumRows, findSeriesCovers, findUnlockedCharacters } from "@/server/repositories/characters";
import {
  addFollow,
  countFollowers,
  findFollowing,
  findProfileSettings,
  findPublicProfiles,
  findPublicReviews,
  findRecentReads,
  findUserByHandle,
  isFollowing,
  removeFollow,
  updateProfileSettings,
} from "@/server/repositories/social";

export class HandleTakenError extends Error {}
export class ProfileNotFoundError extends Error {}

export function getProfileSettings(db: PrismaClient, userId: string) {
  return findProfileSettings(db, userId);
}

export async function saveProfileSettings(db: PrismaClient, userId: string, handle: string, isPublic: boolean) {
  try {
    return await updateProfileSettings(db, userId, handle, isPublic);
  } catch (error) {
    // Nombre de usuario ya en uso (índice único).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new HandleTakenError();
    throw error;
  }
}

export async function listCommunity(db: PrismaClient, userId: string, q?: string) {
  const [profiles, following] = await Promise.all([findPublicProfiles(db, userId, q), findFollowing(db, userId)]);
  return { profiles, following: following.map((f) => f.following) };
}

/** Un perfil público que se puede seguir (no el propio, ni uno privado). */
async function followable(db: PrismaClient, viewerId: string, handle: string) {
  const user = await findUserByHandle(db, handle);
  if (!user || !user.isPublic || user.id === viewerId) throw new ProfileNotFoundError();
  return user;
}

export async function follow(db: PrismaClient, viewerId: string, handle: string) {
  await addFollow(db, viewerId, (await followable(db, viewerId, handle)).id);
}

export async function unfollow(db: PrismaClient, viewerId: string, handle: string) {
  await removeFollow(db, viewerId, (await followable(db, viewerId, handle)).id);
}

/** Álbumes de un usuario en una zona: solo cifras y portada, nunca sus cartas. */
function albumSummaries(rows: Awaited<ReturnType<typeof findAlbumRows>>, unlocked: Set<string>) {
  const bySeries = new Map<string, { title: string; ids: Set<string> }>();
  for (const r of rows) {
    const entry = bySeries.get(r.seriesId) ?? {
      title: r.startYear ? `${r.seriesName} (${r.startYear})` : r.seriesName,
      ids: new Set<string>(),
    };
    if (r.characterId) entry.ids.add(r.characterId);
    bySeries.set(r.seriesId, entry);
  }
  return new Map(
    [...bySeries].map(([seriesId, { title, ids }]) => [
      seriesId,
      { seriesId, title, total: ids.size, ids, discovered: [...ids].filter((id) => unlocked.has(id)).length },
    ]),
  );
}

export interface ComparedAlbumDto {
  seriesId: string;
  title: string;
  coverThumbUrl: string | null;
  total: number;
  /** Sus personajes descubiertos en el álbum. */
  theirs: number;
  /** Los tuyos (null si tú no tienes este álbum). */
  mine: number | null;
  /** Cuántos tiene él que tú no: solo el número, sin decir quiénes (regla de spoilers). */
  ahead: number | null;
  /** Cuántos tienes tú que él no. */
  behind: number | null;
}

/**
 * Perfil público visto por otro usuario (o por el propio dueño, aunque sea privado).
 * Nada de personajes concretos: los álbumes van en cifras y la comparación solo dice cuántos.
 */
export async function getPublicProfile(db: PrismaClient, viewerId: string, handle: string) {
  const user = await findUserByHandle(db, handle);
  const isMe = user?.id === viewerId;
  if (!user || (!user.isPublic && !isMe)) return null;

  const [theirUnlocked, myUnlocked, following, followers, reads, reviews, ...rowsByZone] = await Promise.all([
    findUnlockedCharacters(db, user.id),
    findUnlockedCharacters(db, viewerId),
    isMe ? false : isFollowing(db, viewerId, user.id),
    countFollowers(db, user.id),
    findRecentReads(db, user.id, 8),
    findPublicReviews(db, user.id),
    ...ZONE_KEYS.flatMap((z) => [
      findAlbumRows(db, user.id, ZONES[z].publisherSlug),
      findAlbumRows(db, viewerId, ZONES[z].publisherSlug),
    ]),
  ]);
  const theirSet = new Set(theirUnlocked.map((c) => c.id));
  const mySet = new Set(myUnlocked.map((c) => c.id));

  const shelves = await Promise.all(
    ZONE_KEYS.map(async (zone: Zone, i) => {
      const theirs = albumSummaries(rowsByZone[i * 2], theirSet);
      const mine = albumSummaries(rowsByZone[i * 2 + 1], mySet);
      const covers = await findSeriesCovers(db, [...theirs.keys()]);
      const albums = [...theirs.values()]
        .map((a): ComparedAlbumDto => {
          const my = isMe ? undefined : mine.get(a.seriesId);
          const theirIds = [...a.ids].filter((id) => theirSet.has(id));
          const myIds = [...a.ids].filter((id) => mySet.has(id));
          return {
            seriesId: a.seriesId,
            title: a.title,
            coverThumbUrl: covers.get(a.seriesId) ?? null,
            total: a.total,
            theirs: a.discovered,
            mine: my ? my.discovered : null,
            ahead: my ? theirIds.filter((id) => !mySet.has(id)).length : null,
            behind: my ? myIds.filter((id) => !theirSet.has(id)).length : null,
          };
        })
        .sort((x, y) => y.theirs - x.theirs || x.title.localeCompare(y.title));
      return { zone, albums };
    }),
  );

  return {
    user: { name: user.name, handle: user.handle!, isPublic: user.isPublic },
    isMe,
    isFollowing: following,
    followers,
    shelves,
    activity: reads.map((r) => ({ comic: r.comic, readAt: r.readAt?.toISOString() ?? null })),
    reviews: reviews.map((r) => ({
      comic: r.entry.comic,
      rating: r.entry.rating,
      body: r.body,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}
