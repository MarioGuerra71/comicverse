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
