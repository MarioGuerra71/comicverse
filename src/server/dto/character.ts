import { getCardState, type CardState } from "@/server/domain/card-state";
import type { ReadingStatus } from "@/server/domain/library-status";
import type { CollectionSearchInput } from "@/server/validation/collection";
import { toComicListItem, type ComicListItemDto, type ComicListRow } from "@/server/dto/comic";

// Solo se usa con personajes YA desbloqueados: los bloqueados nunca llegan aquí.
export interface CharacterSummaryRow {
  id: string;
  name: string;
  displayName: string | null;
  imageThumbUrl: string | null;
}

export interface CharacterSummaryDto {
  id: string;
  name: string;
  imageThumbUrl: string | null;
}

export function toCharacterSummary(row: CharacterSummaryRow): CharacterSummaryDto {
  return {
    id: row.id,
    name: row.displayName ?? row.name,
    imageThumbUrl: row.imageThumbUrl,
  };
}

export interface CollectionRow extends CharacterSummaryRow {
  realName: string | null;
  catalogNumber: number | null;
  favorites: { userId: string }[];
  _count: { comics: number };
}

export interface CollectionCardDto extends CharacterSummaryDto {
  /** Número de catálogo fijo (Nº 014). */
  number: number | null;
  realName: string | null;
  state: Exclude<CardState, "LOCKED">;
  comicsRead: number;
  isFavorite: boolean;
  /** Descubierto desde la última visita a la colección (dorado hasta que se ve). */
  isNew: boolean;
}

export interface CollectionDto {
  cards: CollectionCardDto[];
  /** De los bloqueados solo se envía cuántos son: ni id, ni nombre, ni imagen. */
  locked: number;
  /**
   * Y su número de catálogo, para dejar su hueco en el sitio. El orden de catálogo no es
   * alfabético, así que el número no dice quién es.
   */
  lockedNumbers: number[];
  progress: { unlocked: number; total: number };
}

export function toCollection(rows: CollectionRow[]): CollectionDto {
  const cards: CollectionCardDto[] = [];
  const lockedNumbers: number[] = [];
  for (const row of rows) {
    const state = getCardState(row._count.comics);
    if (state === "LOCKED") {
      if (row.catalogNumber !== null) lockedNumbers.push(row.catalogNumber);
      continue;
    }
    cards.push({
      ...toCharacterSummary(row),
      number: row.catalogNumber,
      realName: row.realName,
      state,
      comicsRead: row._count.comics,
      isFavorite: row.favorites.length > 0,
      isNew: false,
    });
  }
  // Orden de catálogo; los que aún no tienen número, al final por nombre.
  cards.sort(
    (a, b) =>
      (a.number ?? Infinity) - (b.number ?? Infinity) || a.name.localeCompare(b.name),
  );
  lockedNumbers.sort((a, b) => a - b);
  return {
    cards,
    locked: rows.length - cards.length,
    lockedNumbers,
    progress: { unlocked: cards.length, total: rows.length },
  };
}

export interface CharacterDetailRow extends CharacterSummaryRow {
  realName: string | null;
  summary: string | null;
  imageUrl: string | null;
  appearancesCount: number | null;
  publisher: { name: string } | null;
  favorites: { userId: string }[];
  comics: { comic: ComicListRow & { userEntries: { status: ReadingStatus }[] } }[];
}

export interface CharacterDetailDto extends CharacterSummaryDto {
  realName: string | null;
  summary: string | null;
  imageUrl: string | null;
  publisher: string | null;
  appearancesCount: number | null;
  state: Exclude<CardState, "LOCKED">;
  comicsRead: number;
  isFavorite: boolean;
  firstAppearance: { id: string; title: string } | null;
  /** Cómics de TU biblioteca donde aparece, con tu estado. */
  comics: { comic: ComicListItemDto; status: ReadingStatus }[];
}

/** Devuelve null si el personaje está bloqueado: nada de sus datos sale de aquí. */
export function toCharacterDetail(
  row: CharacterDetailRow,
  firstAppearance: { id: string; title: string } | null,
): CharacterDetailDto | null {
  const comics = row.comics.map(({ comic }) => ({
    comic: toComicListItem(comic),
    status: comic.userEntries[0].status,
  }));
  const comicsRead = comics.filter((c) => c.status === "READ").length;
  const state = getCardState(comicsRead);
  if (state === "LOCKED") return null;

  return {
    ...toCharacterSummary(row),
    realName: row.realName,
    summary: row.summary,
    imageUrl: row.imageUrl,
    publisher: row.publisher?.name ?? null,
    appearancesCount: row.appearancesCount,
    state,
    comicsRead,
    isFavorite: row.favorites.length > 0,
    firstAppearance,
    comics,
  };
}

/** Filtra y ordena las cartas desbloqueadas (los bloqueados nunca están aquí). */
export function filterCards(cards: CollectionCardDto[], { filter, sort }: CollectionSearchInput) {
  const filtered = cards.filter(
    (card) =>
      filter === "all" ||
      (filter === "favorites" && card.isFavorite) ||
      (filter === "discovered" && card.state === "DISCOVERED") ||
      (filter === "collected" && card.state === "COLLECTED"),
  );
  if (sort === "comics") {
    return [...filtered].sort((a, b) => b.comicsRead - a.comicsRead || a.name.localeCompare(b.name));
  }
  if (sort === "name") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  return filtered; // "number": toCollection ya las deja en orden de catálogo
}
