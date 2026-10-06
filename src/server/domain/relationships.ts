// Relación "aparecen juntos": derivada de las coapariciones en cómics.
// ponytail: umbrales fijados mirando el universo semilla (32 personajes → 169 relaciones,
// ninguno aislado); reajustar al ampliar el universo.
export const MIN_SHARED_COMICS = 5;
export const MIN_SCORE = 0.2;

export interface CoAppearance {
  a: string;
  b: string;
  shared: number;
}

export interface Relationship extends CoAppearance {
  /** Coeficiente de Ochiai: compartidos / √(cómicsA · cómicsB). De 0 a 1. */
  score: number;
}

/**
 * Se queda con las parejas que aparecen juntas de forma significativa.
 * Un número fijo de cómics favorecería a los personajes que salen en todas partes;
 * la puntuación relativa mide cuánto "van juntos" de verdad.
 */
export function pickRelationships(
  pairs: CoAppearance[],
  comicsPerCharacter: Map<string, number>,
): Relationship[] {
  const result: Relationship[] = [];
  for (const pair of pairs) {
    const comicsA = comicsPerCharacter.get(pair.a) ?? 0;
    const comicsB = comicsPerCharacter.get(pair.b) ?? 0;
    if (pair.shared < MIN_SHARED_COMICS || comicsA === 0 || comicsB === 0) continue;
    const score = pair.shared / Math.sqrt(comicsA * comicsB);
    if (score >= MIN_SCORE) result.push({ ...pair, score });
  }
  return result;
}

/** Descubierta = sus dos personajes están desbloqueados. */
export function isDiscovered(relationship: CoAppearance, unlockedIds: Set<string>) {
  return unlockedIds.has(relationship.a) && unlockedIds.has(relationship.b);
}
