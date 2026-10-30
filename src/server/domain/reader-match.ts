// Qué cómic del catálogo es cada archivo del lector. Reglas puras (sin BD), con tests.
import { parseComicFileName, seriesKey } from "@/lib/reader/filename";

export interface MatchFile {
  key: string;
  name: string;
  /** Carpeta del archivo («DC UNIVERSO ABSOLUTE/Absolute Batman»): da el año y agrupa decisiones. */
  path: string;
  /** Serie elegida a mano para este archivo («aplicar a la carpeta»). */
  seriesId?: string;
}

export interface MatchCandidate {
  comicId: string;
  title: string;
  issueNumber: string | null;
  releaseYear: number | null;
  seriesId: string;
  seriesName: string;
  startYear: number | null;
  seriesKey: string;
  /** Ya tienes algún cómic de esta serie en tu biblioteca. */
  owned: boolean;
}

export interface MatchResult {
  key: string;
  match: MatchCandidate | null;
  candidates: MatchCandidate[];
  /** El catálogo tiene alguna serie con ese nombre (si no, se puede traer de Comic Vine). */
  seriesKnown: boolean;
  series: string;
  issue: string | null;
  year: number | null;
}

const yearOf = (c: MatchCandidate) => c.releaseYear ?? c.startYear ?? 0;

/** Lo que el servidor necesita buscar: nombres normalizados y números. */
export function lookupKeys(files: MatchFile[]) {
  const parsed = files.map((f) => ({ file: f, ...parseComicFileName(f.name, f.path) }));
  return {
    parsed,
    keys: [...new Set(parsed.map((p) => seriesKey(p.series)))],
    issues: [...new Set(parsed.flatMap((p) => (p.issue ? [p.issue] : [])))],
  };
}

/**
 * Elige el cómic de cada archivo entre los candidatos (misma serie normalizada y mismo número):
 * 1. una sola serie posible → esa; 2. año en el nombre o la carpeta → la serie de ese año;
 * 3. una sola de esas series en tu biblioteca → esa; 4. lo que se decidió para los demás archivos de
 * la misma carpeta y serie. Si nada de eso decide, se queda sin enlazar y con las opciones.
 */
export function chooseMatches(
  files: MatchFile[],
  rows: MatchCandidate[],
  knownKeys: Set<string>,
): MatchResult[] {
  const { parsed } = lookupKeys(files);
  const results = parsed.map(({ file, series, issue, year }): MatchResult => {
    const key = seriesKey(series);
    const candidates = rows
      .filter((r) => r.seriesKey === key && r.issueNumber === issue && (!file.seriesId || r.seriesId === file.seriesId))
      .sort((a, b) => Number(b.owned) - Number(a.owned) || yearOf(b) - yearOf(a));
    const seriesIds = new Set(candidates.map((c) => c.seriesId));
    let match: MatchCandidate | null = null;
    if (seriesIds.size === 1) match = candidates[0];
    else if (candidates.length > 1 && year) {
      match = [...candidates].sort((a, b) => Math.abs(yearOf(a) - year) - Math.abs(yearOf(b) - year))[0];
    } else if (candidates.filter((c) => c.owned).length === 1) match = candidates.find((c) => c.owned)!;
    return { key: file.key, match, candidates: candidates.slice(0, 8), seriesKnown: knownKeys.has(key), series, issue, year };
  });

  // Coherencia por carpeta: si un archivo de «Green Lantern» ya decidió la serie, los demás de esa
  // carpeta con el mismo nombre van a la misma.
  const decided = new Map<string, string>();
  results.forEach((r, i) => {
    if (r.match) decided.set(`${files[i].path}|${seriesKey(r.series)}`, r.match.seriesId);
  });
  return results.map((r, i) => {
    if (r.match) return r;
    const seriesId = decided.get(`${files[i].path}|${seriesKey(r.series)}`);
    const match = seriesId ? (r.candidates.find((c) => c.seriesId === seriesId) ?? null) : null;
    return { ...r, match };
  });
}

export interface RemoteVolume {
  id: number;
  name: string;
  start_year: string | number | null;
  count_of_issues: number | null;
  publisher: { id: number } | null;
}

/**
 * La serie de Comic Vine que corresponde a un nombre: mismo nombre normalizado, de una editorial
 * que tenemos (Marvel o DC) y con el número buscado. Varias → la del año; sin año, ninguna (mejor no
 * importar la que no es).
 */
export function chooseRemoteVolume(
  volumes: RemoteVolume[],
  { series, issue, year }: { series: string; issue: string | null; year: number | null },
  publisherIds: Set<number>,
): RemoteVolume | null {
  const key = seriesKey(series);
  const fits = volumes.filter(
    (v) =>
      v.publisher &&
      publisherIds.has(v.publisher.id) &&
      seriesKey(v.name) === key &&
      (v.count_of_issues ?? 0) >= Math.max(1, Math.floor(Number(issue ?? 1))),
  );
  if (fits.length <= 1) return fits[0] ?? null;
  if (!year) return null;
  const start = (v: RemoteVolume) => Number(v.start_year) || 0;
  // La que empezó ese año o justo antes (una serie de 2005 sigue saliendo en 2008).
  const before = fits.filter((v) => start(v) <= year).sort((a, b) => start(b) - start(a));
  return before[0] ?? null;
}
