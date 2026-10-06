// Convierte los aliados/enemigos de Comic Vine en parejas sugeridas DENTRO de nuestro universo.

export interface CharacterLinks {
  id: number;
  label: string;
  friends: number[];
  enemies: number[];
}

export type SuggestedType = "ALLY" | "ENEMY" | "CONFLICT";

export interface RelationshipSuggestion {
  a: { id: number; label: string };
  b: { id: number; label: string };
  type: SuggestedType;
}

export function buildRelationshipSuggestions(characters: CharacterLinks[]): RelationshipSuggestion[] {
  const byId = new Map(characters.map((c) => [c.id, c]));
  // Clave "menor-mayor": la pareja A–B y B–A es la misma relación.
  const pairs = new Map<string, { a: number; b: number; ally: boolean; enemy: boolean }>();

  const add = (from: number, to: number, kind: "ally" | "enemy") => {
    if (from === to || !byId.has(to)) return; // fuera de nuestro universo: se ignora
    const [a, b] = from < to ? [from, to] : [to, from];
    const key = `${a}-${b}`;
    const pair = pairs.get(key) ?? { a, b, ally: false, enemy: false };
    pair[kind] = true;
    pairs.set(key, pair);
  };

  for (const c of characters) {
    for (const id of c.friends) add(c.id, id, "ally");
    for (const id of c.enemies) add(c.id, id, "enemy");
  }

  return [...pairs.values()]
    .map((p) => ({
      a: { id: p.a, label: byId.get(p.a)!.label },
      b: { id: p.b, label: byId.get(p.b)!.label },
      type: (p.ally && p.enemy ? "CONFLICT" : p.ally ? "ALLY" : "ENEMY") as SuggestedType,
    }))
    .sort((x, y) => x.a.label.localeCompare(y.a.label) || x.b.label.localeCompare(y.b.label));
}
