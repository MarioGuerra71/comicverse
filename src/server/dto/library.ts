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

export interface ReviewDto {
  body: string;
  isPublic: boolean;
  updatedAt: string;
}

export function toReview(row: { body: string; isPublic: boolean; updatedAt: Date }): ReviewDto {
  return { body: row.body, isPublic: row.isPublic, updatedAt: row.updatedAt.toISOString() };
}

export interface LibrarySeriesDto {
  id: string;
  name: string;
  startYear: number | null;
  /** Hasta 3 portadas, las más recientes primero (para el montón de la carpeta). */
  covers: string[];
  total: number;
  read: number;
}

/** Agrupa las entradas por serie; las carpetas salen en el orden de su entrada más reciente. */
export function groupBySeries(
  rows: {
    status: ReadingStatus;
    comic: {
      coverThumbUrl: string | null;
      series: { id: string; name: string; startYear: number | null; _count: { comics: number } };
    };
  }[],
): LibrarySeriesDto[] {
  const groups = new Map<string, LibrarySeriesDto>();
  for (const { status, comic } of rows) {
    const { id, name, startYear, _count } = comic.series;
    // El total es la serie entera del catálogo, no solo lo que tienes en la biblioteca.
    const group = groups.get(id) ?? { id, name, startYear, covers: [], total: _count.comics, read: 0 };
    if (status === "READ") group.read += 1;
    if (comic.coverThumbUrl && group.covers.length < 3) group.covers.push(comic.coverThumbUrl);
    groups.set(comic.series.id, group);
  }
  return [...groups.values()];
}
