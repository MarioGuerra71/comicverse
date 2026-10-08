// Zonas de la app: cada una muestra el catálogo de una editorial y se pinta con su color
// (atributo data-publisher, ver globals.css). Compartido entre cliente y servidor.
export const ZONES = {
  marvel: { label: "Marvel", publisherSlug: "marvel" },
  dc: { label: "DC", publisherSlug: "dc-comics" },
} as const;

export type Zone = keyof typeof ZONES;

export const ZONE_KEYS = Object.keys(ZONES) as Zone[];
export const ZONE_COOKIE = "cv-zone";

/** Cualquier valor desconocido o ausente es Marvel (la zona por defecto). */
export function parseZone(value: string | undefined): Zone {
  return value === "dc" ? "dc" : "marvel";
}
