import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { ComicSearchInput, ComicSort } from "@/server/validation/catalog";

export const comicListSelect = {
  id: true,
  title: true,
  storyTitle: true,
  releaseDate: true,
  coverThumbUrl: true,
  series: {
    select: {
      id: true,
      name: true,
      startYear: true,
      publisher: { select: { name: true } },
    },
  },
  _count: { select: { characters: true } },
} satisfies Prisma.ComicSelect;

function buildWhere(input: ComicSearchInput): Prisma.ComicWhereInput {
  const where: Prisma.ComicWhereInput = {};

  if (input.seriesId) where.seriesId = input.seriesId;

  if (input.q) {
    where.OR = [
      { title: { contains: input.q, mode: "insensitive" } },
      { storyTitle: { contains: input.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(sort: ComicSort): Prisma.ComicOrderByWithRelationInput[] {
  switch (sort) {
    case "release_asc":
      return [{ releaseDate: { sort: "asc", nulls: "last" } }, { id: "asc" }];
    case "title":
      return [{ title: "asc" }, { id: "asc" }];
    default:
      return [{ releaseDate: { sort: "desc", nulls: "last" } }, { id: "asc" }];
  }
}

export async function findComicsPage(db: PrismaClient, input: ComicSearchInput) {
  const where = buildWhere(input);

  const [rows, total] = await db.$transaction([
    db.comic.findMany({
      where,
      orderBy: buildOrderBy(input.sort),
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: comicListSelect,
    }),
    db.comic.count({ where }),
  ]);

  return { rows, total };
}
export function findComicById(db: PrismaClient, id: string) {
  return db.comic.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      storyTitle: true,
      description: true,
      releaseDate: true,
      coverUrl: true,
      series: {
        select: {
          id: true,
          name: true,
          startYear: true,
          publisher: { select: { name: true } },
        },
      },
      _count: { select: { characters: true } },
    },
  });
}

export function findSeriesOptions(db: PrismaClient) {
  return db.series.findMany({
    orderBy: [{ name: "asc" }, { startYear: "asc" }],
    select: { id: true, name: true, startYear: true },
  });
}