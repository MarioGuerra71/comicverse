import type { PrismaClient } from "../../../generated/prisma/client";

const publicUserSelect = { id: true, name: true, handle: true } as const;

export function findProfileSettings(db: PrismaClient, userId: string) {
  return db.user.findUnique({ where: { id: userId }, select: { handle: true, isPublic: true } });
}

export function findUserByHandle(db: PrismaClient, handle: string) {
  return db.user.findUnique({ where: { handle }, select: { ...publicUserSelect, isPublic: true } });
}

/** Perfiles públicos (con búsqueda por nombre o usuario). */
export function findPublicProfiles(db: PrismaClient, excludeUserId: string, q?: string) {
  return db.user.findMany({
    where: {
      isPublic: true,
      handle: { not: null },
      id: { not: excludeUserId },
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { handle: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 48,
    select: publicUserSelect,
  });
}

/** A quién sigue el usuario (solo los que siguen siendo públicos). */
export function findFollowing(db: PrismaClient, userId: string) {
  return db.follow.findMany({
    where: { followerId: userId, following: { isPublic: true, handle: { not: null } } },
    orderBy: { createdAt: "desc" },
    select: { following: { select: publicUserSelect } },
  });
}

export async function isFollowing(db: PrismaClient, followerId: string, followingId: string) {
  return (await db.follow.count({ where: { followerId, followingId } })) > 0;
}

export function countFollowers(db: PrismaClient, userId: string) {
  // Solo el número: no dice quién sigue, así que cuentan también los perfiles privados.
  return db.follow.count({ where: { followingId: userId } });
}

export function addFollow(db: PrismaClient, followerId: string, followingId: string) {
  return db.follow.createMany({ data: [{ followerId, followingId }], skipDuplicates: true });
}

export function removeFollow(db: PrismaClient, followerId: string, followingId: string) {
  return db.follow.deleteMany({ where: { followerId, followingId } });
}

/** Últimos cómics leídos (para la actividad del perfil público). */
export function findRecentReads(db: PrismaClient, userId: string, take: number) {
  return db.userComic.findMany({
    where: { userId, status: "READ" },
    orderBy: [{ readAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take,
    select: { readAt: true, comic: { select: { id: true, title: true, coverThumbUrl: true } } },
  });
}

/** Reseñas que el usuario ha marcado como públicas (solo de cómics que sigue teniendo leídos). */
export function findPublicReviews(db: PrismaClient, userId: string) {
  return db.review.findMany({
    where: { userId, isPublic: true, entry: { status: "READ" } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      body: true,
      updatedAt: true,
      entry: { select: { rating: true, comic: { select: { id: true, title: true, coverThumbUrl: true } } } },
    },
  });
}

export async function findHandleOwner(db: PrismaClient, handle: string) {
  return (await db.user.findUnique({ where: { handle }, select: { id: true } }))?.id ?? null;
}

export function findUserName(db: PrismaClient, userId: string) {
  return db.user.findUnique({ where: { id: userId }, select: { name: true, handle: true } });
}

export function updateHandle(db: PrismaClient, userId: string, handle: string) {
  return db.user.update({ where: { id: userId }, data: { handle }, select: { handle: true, isPublic: true } });
}

export function updateVisibility(db: PrismaClient, userId: string, isPublic: boolean) {
  return db.user.update({ where: { id: userId }, data: { isPublic }, select: { handle: true, isPublic: true } });
}
