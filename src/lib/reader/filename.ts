// Del nombre de un archivo de cómic («Green Lantern 020 (2025) (Digital).cbr») y su carpeta a
// serie, número y año. Sin dependencias: lo usan el lector (navegador) y el emparejamiento (servidor).

export interface ParsedFileName {
  series: string;
  issue: string | null;
  year: number | null;
}

const YEAR = /\b(19[3-9]\d|20[0-4]\d)\b/;

/** Año que aparezca en las carpetas («GREEN LANTERN 2005»), de la más cercana al archivo a la más lejana. */
export function yearFromPath(path: string): number | null {
  for (const segment of path.split("/").filter(Boolean).reverse()) {
    const year = segment.match(YEAR)?.[1];
    if (year) return Number(year);
  }
  return null;
}

export function parseComicFileName(fileName: string, folderPath = ""): ParsedFileName {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  const year = base.match(/\((19\d{2}|20\d{2})\)/)?.[1];
  // «Green Lantern Corps (53)»: un número corto entre paréntesis es el número del cómic.
  const parenIssue = base.match(/\((\d{1,3})\)/)?.[1];
  const clean = base
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ") // (2025) (Digital) [grupo]
    .replace(/\.?\b[\w-]+\.(?:blogspot\.)?(?:com|net|org|es)\b.*$/i, " ") // «.howtoarsenio.blogspot.com»
    .replace(/^\s*\d+\s*-\s+|^\d+(?=[A-Z])/, "") // «310 - », «02 - » o «09Green»: orden de lectura de la carpeta
    .replace(/^GL\s/i, "Green Lantern ") // «GL Emerald Warriors»
    .replace(/_+|(?<!\d)\.|\.(?!\d)/g, " ") // guiones bajos y puntos, salvo el de «1.5»
    .replace(/\bv(?:ol)?\s?\d+\b/gi, " ") // v6, vol 2
    .replace(/\s+/g, " ")
    .trim();
  // Con «#», el número es lo que va detrás; si no, la última cifra suelta («Green Lantern 020»).
  const match =
    clean.match(/^(.*?)\s*#\s*(\d+(?:\.\d+)?)\b/) ?? clean.match(/^(.*?)\s+(\d+(?:\.\d+)?)(?:\s+of\s+\d+)?\s*$/i);
  const series = (match ? match[1] : clean).replace(/[\s#:-]+$/, "").trim();
  const issue = match ? String(Number.parseFloat(match[2])) : parenIssue ? String(Number(parenIssue)) : null;
  return { series: series || clean, issue, year: year ? Number(year) : yearFromPath(folderPath) };
}

/** Nombre de serie comparable: «Green Lantern: Rebirth» y «green lantern - rebirth» son lo mismo. */
export const seriesKey = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

/** Orden natural de las páginas: «2.jpg» antes que «10.jpg». */
export const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export const IMAGE_FILE = /\.(jpe?g|png|webp|gif|avif)$/i;
