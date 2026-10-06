import type { RelationshipType } from "@/lib/relationship-types";

// Relaciones = curadas (data/relationships.json, con tipo) + "aparecen juntos" (derivadas).
// ponytail: umbrales fijados mirando el universo semilla (32 personajes → 169 relaciones,
// ninguno aislado); reajustar al ampliar el universo.
export const MIN_SHARED_COMICS = 5;
export const MIN_SCORE = 0.2;

export interface CoAppearance {
  a: string;
  b: string;
  shared: number;
}

export interface CuratedRelationship {
  a: string;
  b: string;
  type: RelationshipType;
}

export interface Relationship extends CoAppearance {
  /** Coeficiente de Ochiai: compartidos / √(cómicsA · cómicsB). De 0 a 1. */
  score: number;
  /** Tipo curado; null si solo "aparecen juntos". */
  type: RelationshipType | null;
}

// La misma pareja sin importar el orden de a y b.
const pairKey = (x: string, y: string) => (x < y ? `${x}|${y}` : `${y}|${x}`);

/**
 * Se queda con las parejas curadas y con las que aparecen juntas de forma significativa.
 * Un número fijo de cómics favorecería a los personajes que salen en todas partes;
 * la puntuación relativa mide cuánto "van juntos" de verdad.
 */
export function pickRelationships(
  pairs: CoAppearance[],
  comicsPerCharacter: Map<string, number>,
  curated: CuratedRelationship[] = [],
): Relationship[] {
  const curatedByKey = new Map(curated.map((c) => [pairKey(c.a, c.b), c]));
  const result: Relationship[] = [];
  for (const pair of pairs) {
    const key = pairKey(pair.a, pair.b);
    const type = curatedByKey.get(key)?.type ?? null;
    curatedByKey.delete(key);
    const comicsA = comicsPerCharacter.get(pair.a) ?? 0;
    const comicsB = comicsPerCharacter.get(pair.b) ?? 0;
    const score = comicsA && comicsB ? pair.shared / Math.sqrt(comicsA * comicsB) : 0;
    const significant = pair.shared >= MIN_SHARED_COMICS && score >= MIN_SCORE;
    if (type || significant) result.push({ ...pair, score, type });
  }
  // Curadas que no comparten ningún cómic importado: cuentan igual.
  for (const c of curatedByKey.values()) {
    result.push({ a: c.a, b: c.b, shared: 0, score: 0, type: c.type });
  }
  return result;
}

/** Descubierta = sus dos personajes están desbloqueados. */
export function isDiscovered(relationship: CoAppearance, unlockedIds: Set<string>) {
  return unlockedIds.has(relationship.a) && unlockedIds.has(relationship.b);
}
