import type { PrismaClient } from "../../../generated/prisma/client";
import { toComicDetail, toComicListItem } from "@/server/dto/comic";
import {
  findComicById,
  findComicsPage,
  findSeriesOptions,
} from "@/server/repositories/comics";
import type { ComicSearchInput } from "@/server/validation/catalog";
export async function searchComics(db: PrismaClient, input: ComicSearchInput) {
  const { rows, total } = await findComicsPage(db, input);

  return {
    items: rows.map(toComicListItem),
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}
export async function getComicDetail(db: PrismaClient, id: string) {
  const row = await findComicById(db, id);
  return row ? toComicDetail(row) : null;
}

export async function listSeries(db: PrismaClient) {
  return findSeriesOptions(db);
}