// Enlaza los cómics del lector con el catálogo usando la API (/api/v1/reader/*). Copia local de
// los tipos de respuesta: el navegador no importa nada de src/server.
import { seriesKey } from "@/lib/reader/filename";
import { updateLocalComics, type LocalComic } from "@/lib/reader/local-library";

export interface Candidate {
  comicId: string;
  title: string;
  releaseYear: number | null;
  seriesId: string;
  seriesName: string;
  startYear: number | null;
  owned: boolean;
}

interface MatchResult {
  key: string;
  match: Candidate | null;
  candidates: Candidate[];
  seriesKnown: boolean;
  series: string;
  issue: string | null;
}

async function post<T>(url: string, body: object): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.ok ? { ok: true, data: (await response.json()) as T } : { ok: false, status: response.status };
}

/** Pide al servidor el cómic de cada archivo y guarda los enlaces encontrados. */
export async function matchComics(comics: LocalComic[], seriesId?: string): Promise<MatchResult[]> {
  const results: MatchResult[] = [];
  for (let i = 0; i < comics.length; i += 100) {
    const batch = comics.slice(i, i + 100);
    const res = await post<{ results: MatchResult[] }>("/api/v1/reader/match", {
      files: batch.map((c) => ({ key: c.id, name: c.fileName, path: c.folder, ...(seriesId ? { seriesId } : {}) })),
    });
    if (!res.ok) continue;
    results.push(...res.data.results);
    const changes = new Map(
      res.data.results.flatMap((r) => (r.match ? [[r.key, { comicId: r.match.comicId, comicTitle: r.match.title }] as const] : [])),
    );
    if (changes.size) updateLocalComics(changes);
  }
  return results;
}

/**
 * Todo lo automático: empareja; las series que el catálogo no tiene se traen de Comic Vine (una
 * petición por serie) y se vuelve a emparejar. Devuelve cuántos quedan sin enlazar.
 */
export async function autoLink(comics: LocalComic[], onStatus: (text: string) => void) {
  const pending = comics.filter((c) => !c.comicId);
  if (pending.length === 0) return 0;
  onStatus(`Buscando ${pending.length === 1 ? "el cómic" : `${pending.length} cómics`} en el catálogo…`);
  const results = await matchComics(pending);
  const byId = new Map(pending.map((c) => [c.id, c]));

  // Series desconocidas, agrupadas por nombre: se intenta traer cada una una sola vez.
  const unknown = new Map<string, LocalComic[]>();
  for (const r of results) {
    if (r.match || r.seriesKnown || !r.issue) continue;
    const group = seriesKey(r.series);
    unknown.set(group, [...(unknown.get(group) ?? []), byId.get(r.key)!]);
  }
  let left = results.filter((r) => !r.match).length;
  for (const [, group] of unknown) {
    onStatus(`Trayendo «${group[0].fileName.replace(/\.[^.]+$/, "")}» de Comic Vine…`);
    const res = await post<{ series: string | null }>("/api/v1/reader/import", { name: group[0].fileName, path: group[0].folder });
    if (!res.ok && res.status === 429) {
      onStatus("Se ha alcanzado el límite de series por hora de Comic Vine; el resto se enlazará más tarde.");
      return left;
    }
    if (res.ok && res.data.series) left -= (await matchComics(group)).filter((r) => r.match).length;
  }
  return left;
}

/** Búsqueda manual: «green lantern 21» → «Green Lantern #21» de cada serie. */
export async function searchCandidates(q: string): Promise<Candidate[]> {
  const res = await post<{ candidates: Candidate[] }>("/api/v1/reader/match", { q });
  return res.ok ? res.data.candidates : [];
}

export interface RemoteSeries {
  externalId: number;
  name: string;
  startYear: string | null;
  issueCount: number;
  seriesId: string | null;
  publisher: "marvel" | "dc";
}

/** Series de Comic Vine con ese nombre (para cuando el catálogo no la tiene o hay varias). */
export async function searchRemote(q: string): Promise<RemoteSeries[] | "RATE_LIMITED" | "ERROR"> {
  const res = await post<{ series: RemoteSeries[] }>("/api/v1/reader/remote", { q });
  if (res.ok) return res.data.series;
  return res.status === 429 ? "RATE_LIMITED" : "ERROR";
}

/** Trae una serie de Comic Vine al catálogo (si no estaba) y devuelve su id. */
export async function importRemote(series: RemoteSeries): Promise<string | null> {
  if (series.seriesId) return series.seriesId;
  const res = await post<{ seriesId: string }>("/api/v1/series/import", {
    externalId: series.externalId,
    publisher: series.publisher,
  });
  return res.ok ? res.data.seriesId : null;
}
