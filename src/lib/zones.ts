// Zonas de la app: cada una muestra el catálogo de una editorial y se pinta con su color
// (atributo data-publisher, ver globals.css). Compartido entre cliente y servidor.
export const ZONES = {
  // comicVineId: id de la editorial en Comic Vine (filtra ediciones extranjeras de la misma serie).
  marvel: { label: "Marvel", publisherSlug: "marvel", comicVineId: 31 },
  dc: { label: "DC", publisherSlug: "dc-comics", comicVineId: 10 },
} as const;

export type Zone = keyof typeof ZONES;

export const ZONE_KEYS = Object.keys(ZONES) as Zone[];
export const ZONE_COOKIE = "cv-zone";

/** Cualquier valor desconocido o ausente es Marvel (la zona por defecto). */
export function parseZone(value: string | undefined): Zone {
  return value === "dc" ? "dc" : "marvel";
}

/** Cookie con cuántas veces se ha abierto la portada o el acceso (para alternar la editorial). */
export const BRAND_VISITS_COOKIE = "cv-brand-visits";

/**
 * Editorial del bloque de la portada y el acceso (idea del usuario): la primera visita Marvel,
 * la segunda DC y después al azar. `visits` ya incluye la visita actual: el proxy pone la cookie
 * y Next se la deja ver a la página en la misma petición.
 */
export function brandZoneForVisit(visits: number, random: () => number = Math.random): Zone {
  if (visits <= 1) return "marvel";
  if (visits === 2) return "dc";
  return random() < 0.5 ? "marvel" : "dc";
}
