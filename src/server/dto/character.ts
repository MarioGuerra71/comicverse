import { getCardState, type CardState } from "@/server/domain/card-state";

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
