import type { PrismaClient } from "../../../generated/prisma/client";
import { toComicListItem } from "@/server/dto/comic";
import { findComicsPage } from "@/server/repositories/comics";
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