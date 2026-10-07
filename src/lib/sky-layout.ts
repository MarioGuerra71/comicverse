// Posición de cada número de catálogo en "tu cielo": espiral de girasol (ángulo áureo),
// que reparte los puntos sin amontonarlos. Solo depende del número, nunca del personaje:
// un hueco bloqueado ocupa siempre su sitio sin revelar quién es.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Coordenadas entre 0 y 1 (el componente las escala al tamaño del dibujo). */
export function skyPosition(number: number, total: number) {
  const i = number - 0.5;
  const r = Math.sqrt(i / Math.max(total, 1));
  const angle = i * GOLDEN_ANGLE;
  return { x: 0.5 + 0.46 * r * Math.cos(angle), y: 0.5 + 0.44 * r * Math.sin(angle) };
}

/**
 * Constelaciones legibles: cada estrella conserva como mucho `maxPerStar` líneas, las de
 * más cómics juntos primero. Sin este límite, el personaje central se lleva decenas de
 * líneas y el cielo parece un diagrama de red.
 */
export function pickConstellations<T extends { a: string; b: string; shared: number }>(
  edges: T[],
  maxPerStar = 3,
): T[] {
  const degree = new Map<string, number>();
  const kept: T[] = [];
  for (const edge of [...edges].sort((x, y) => y.shared - x.shared)) {
    const da = degree.get(edge.a) ?? 0;
    const db = degree.get(edge.b) ?? 0;
    if (da >= maxPerStar || db >= maxPerStar) continue;
    degree.set(edge.a, da + 1);
    degree.set(edge.b, db + 1);
    kept.push(edge);
  }
  return kept;
}
