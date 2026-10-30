// Del nombre de un archivo de cómic («Green Lantern 020 (2025) (Digital).cbr») a serie, número y
// año, y del resultado de la búsqueda al cómic del catálogo que le corresponde. Sin dependencias:
// lo usa el lector en el navegador.

export interface ParsedFileName {
  series: string;
  issue: string | null;
  year: number | null;
}

export function parseComicFileName(fileName: string): ParsedFileName {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  const year = base.match(/\((19\d{2}|20\d{2})\)/)?.[1];
  const clean = base
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ") // (2025) (Digital) [grupo]
    .replace(/_+|(?<!\d)\.|\.(?!\d)/g, " ") // guiones bajos y puntos, salvo el de «1.5»
    .replace(/\bv(?:ol)?\s?\d+\b/gi, " ") // v6, vol 2
    .replace(/\s+/g, " ")
    .trim();
  // El número es la última cifra suelta: «Green Lantern 020», «Absolute Batman #1», «X-Men 1.5».
  const match = clean.match(/^(.*?)\s*#?\s*(\d+(?:\.\d+)?)(?:\s+of\s+\d+)?\s*$/i);
  const series = (match ? match[1] : clean).replace(/[\s#-]+$/, "").trim();
  const issue = match ? String(Number.parseFloat(match[2])) : null;
  return { series: series || clean, issue, year: year ? Number(year) : null };
}

/** Lo que se busca en el catálogo: «Green Lantern #20». */
export const searchQuery = ({ series, issue }: ParsedFileName) => (issue ? `${series} #${issue}` : series);

export interface MatchCandidate {
  id: string;
  title: string;
  releaseDate: string | null;
  series: { startYear: number | null };
}

/**
 * El cómic que corresponde al archivo: título exacto («Green Lantern #20») y, si hay varias
 * series con ese nombre, la de fecha más cercana al año del archivo. Null si no está claro.
 */
export function pickBestMatch<T extends MatchCandidate>(candidates: T[], parsed: ParsedFileName): T | null {
  const wanted = searchQuery(parsed).toLowerCase();
  const exact = candidates.filter((c) => c.title.toLowerCase() === wanted);
  if (exact.length <= 1) return exact[0] ?? null;
  if (!parsed.year) return null;
  const yearOf = (c: T) => (c.releaseDate ? Number(c.releaseDate.slice(0, 4)) : (c.series.startYear ?? 0));
  return [...exact].sort((a, b) => Math.abs(yearOf(a) - parsed.year!) - Math.abs(yearOf(b) - parsed.year!))[0];
}

/** Orden natural de las páginas: «2.jpg» antes que «10.jpg». */
export const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export const IMAGE_FILE = /\.(jpe?g|png|webp|gif|avif)$/i;
