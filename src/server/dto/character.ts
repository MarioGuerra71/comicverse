import { getCardState, type CardState } from "@/server/domain/card-state";
import type { ReadingStatus } from "@/server/domain/library-status";
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
  _count: { comics: number };
}

export interface CollectionCardDto extends CharacterSummaryDto {
  realName: string | null;
  state: Exclude<CardState, "LOCKED">;
  comicsRead: number;
}

export interface CollectionDto {
  cards: CollectionCardDto[];
  /** De los bloqueados solo se envía cuántos son: ni id, ni nombre, ni imagen. */
  locked: number;
  progress: { unlocked: number; total: number };
}

export function toCollection(rows: CollectionRow[]): CollectionDto {
  const cards: CollectionCardDto[] = [];
  for (const row of rows) {
    const state = getCardState(row._count.comics);
    if (state === "LOCKED") continue;
    cards.push({
      ...toCharacterSummary(row),
      realName: row.realName,
      state,
      comicsRead: row._count.comics,
    });
  }
  cards.sort((a, b) => a.name.localeCompare(b.name));
  return {
    cards,
    locked: rows.length - cards.length,
    progress: { unlocked: cards.length, total: rows.length },
  };
}

export interface CharacterDetailRow extends CharacterSummaryRow {
  realName: string | null;
  summary: string | null;
  imageUrl: string | null;
  appearancesCount: number | null;
  publisher: { name: string } | null;
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
    firstAppearance,
    comics,
  };
}
