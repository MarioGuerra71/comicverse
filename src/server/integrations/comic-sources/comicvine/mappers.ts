// ---------- Nombre real ----------

const EMPTY_REAL_NAMES = new Set(["none", "unknown", "n/a"]);

/** Limpia el nombre real: recorta espacios y trata "None" y vacío como "sin dato". */
export function cleanRealName(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (EMPTY_REAL_NAMES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

// ---------- Descripciones: HTML a texto plano ----------

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  // Una sola pasada: "&amp;lt;" se queda en "&lt;" y no se decodifica dos veces.
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const isHex = entity[1].toLowerCase() === "x";
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      const invalid =
        !Number.isFinite(code) ||
        code < 1 ||
        code > 0x10ffff ||
        (code >= 0xd800 && code <= 0xdfff);
      return invalid ? "" : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Convierte HTML en texto plano y lo recorta a maxLength caracteres.
 * El resultado NO contiene etiquetas: se debe mostrar siempre como texto.
 */
export function htmlToText(
  html: string | null | undefined,
  maxLength = 2000,
): string | null {
  if (!html) return null;

  const withBreaks = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|table|ul|ol)>/gi, "\n");

  // Primero se quitan las etiquetas y DESPUÉS se decodifican las entidades.
  const stripped = withBreaks.replace(/<[^>]*>/g, "");

  const text = decodeEntities(stripped)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text === "") return null;
  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const clean = lastSpace > maxLength * 0.8 ? cut.slice(0, lastSpace) : cut;
  return `${clean.trimEnd()}…`;
}

// ---------- Título del cómic ----------

/** "The Amazing Spider-Man" + "15" -> "The Amazing Spider-Man #15". */
export function buildComicTitle(
  seriesName: string,
  issueNumber: string | null | undefined,
): string {
  const series = seriesName.trim();
  const number = issueNumber?.trim();
  return number ? `${series} #${number}` : series;
}

// ---------- Fecha de salida ----------

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Si la fecha "rebosa" (por ejemplo 30 de febrero), no coincidirá al reconvertirla.
  return date.toISOString().slice(0, 10) === value ? date : null;
}

/** Fecha de venta; si falta o no es válida, la fecha de portada. */
export function pickReleaseDate(
  storeDate: string | null | undefined,
  coverDate: string | null | undefined,
): Date | null {
  return parseIsoDate(storeDate) ?? parseIsoDate(coverDate);
}

// ---------- Imágenes ----------

export interface ComicVineImage {
  super_url?: string | null;
  medium_url?: string | null;
  small_url?: string | null;
  thumb_url?: string | null;
  original_url?: string | null;
}

/** De las nueve versiones de imagen que da la API, nos quedamos con dos. */
export function pickImageUrls(image: ComicVineImage | null | undefined): {
  url: string | null;
  thumbUrl: string | null;
} {
  if (!image) return { url: null, thumbUrl: null };
  return {
    url: image.super_url || image.medium_url || image.original_url || null,
    thumbUrl: image.medium_url || image.small_url || image.thumb_url || null,
  };
}
// ---------- Slugs ----------

/** "Marvel Comics!" -> "marvel-comics". Quita acentos y símbolos. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}