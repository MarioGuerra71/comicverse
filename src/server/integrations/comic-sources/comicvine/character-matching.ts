export interface CharacterSearchResult {
  id: number;
  name: string;
  count_of_issue_appearances: number | null;
  publisher: { id: number; name: string } | null;
}

export type MatchStatus = "EXACT" | "FUZZY" | "NOT_FOUND";

export interface CharacterMatch<T extends CharacterSearchResult> {
  chosen: T | null;
  status: MatchStatus;
  alternatives: T[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function byAppearancesDesc(a: CharacterSearchResult, b: CharacterSearchResult) {
  return (b.count_of_issue_appearances ?? 0) - (a.count_of_issue_appearances ?? 0);
}

/**
 * Elige el mejor personaje de una lista de resultados de búsqueda:
 * 1) solo de la editorial indicada,
 * 2) con el nombre exacto si lo hay (EXACT); si no, el más popular (FUZZY),
 * 3) en caso de empate, el que tiene más apariciones.
 */
export function pickBestCharacter<T extends CharacterSearchResult>(
  results: T[],
  query: string,
  publisherId: number,
): CharacterMatch<T> {
  const fromPublisher = results
    .filter((r) => r.publisher?.id === publisherId)
    .sort(byAppearancesDesc);

  const wanted = normalize(query);
  const exact = fromPublisher.filter((r) => normalize(r.name) === wanted);

  const pool = exact.length > 0 ? exact : fromPublisher;
  const chosen = pool[0] ?? null;

  return {
    chosen,
    status: chosen === null ? "NOT_FOUND" : exact.length > 0 ? "EXACT" : "FUZZY",
    alternatives: fromPublisher.filter((r) => r !== chosen).slice(0, 3),
  };
}