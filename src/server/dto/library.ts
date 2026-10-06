import { toComicListItem, type ComicListItemDto, type ComicListRow } from "@/server/dto/comic";
import type { ReadingStatus } from "@/server/domain/library-status";

export interface LibraryEntryRow {
  comicId: string;
  status: ReadingStatus;
  isFavorite: boolean;
  rating: number | null;
  startedAt: Date | null;
  readAt: Date | null;
}

// La puntuación se conserva al salir de Leído, pero solo se muestra en Leído.
function visibleRating(row: { status: ReadingStatus; rating: number | null }) {
  return row.status === "READ" ? row.rating : null;
}

export interface LibraryEntryDto {
  comicId: string;
  status: ReadingStatus;
  isFavorite: boolean;
  rating: number | null;
  startedAt: string | null;
  readAt: string | null;
}

export function toLibraryEntry(row: LibraryEntryRow): LibraryEntryDto {
  return {
    comicId: row.comicId,
    status: row.status,
    isFavorite: row.isFavorite,
    rating: visibleRating(row),
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    readAt: row.readAt ? row.readAt.toISOString() : null,
  };
}

export interface LibraryItemRow {
  status: ReadingStatus;
  isFavorite: boolean;
  rating: number | null;
  startedAt: Date | null;
  readAt: Date | null;
  updatedAt: Date;
  comic: ComicListRow;
}

export interface LibraryItemDto {
  comic: ComicListItemDto;
  status: ReadingStatus;
  isFavorite: boolean;
  rating: number | null;
  startedAt: string | null;
  readAt: string | null;
  updatedAt: string;
}

export function toLibraryItem(row: LibraryItemRow): LibraryItemDto {
  return {
    comic: toComicListItem(row.comic),
    status: row.status,
    isFavorite: row.isFavorite,
    rating: visibleRating(row),
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}