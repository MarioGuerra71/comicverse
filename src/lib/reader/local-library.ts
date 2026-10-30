// La estantería del lector vive solo en este dispositivo: las páginas, en la Cache API del
// navegador («/reader-pages/<id>/<n>»); la ficha de cada cómic, en localStorage. Nada de esto se
// sube al servidor. (Se usaba OPFS, pero escribir en él falla en navegadores Android.)
import { readArchivePages } from "@/lib/reader/archive";

export interface LocalComic {
  id: string;
  fileName: string;
  /** Carpeta dentro del lector («DC UNIVERSO ABSOLUTE/Absolute Batman»); "" es la raíz. */
  folder: string;
  pages: number;
  addedAt: string;
  /** Cómic del catálogo con el que está enlazado. */
  comicId: string | null;
  comicTitle: string | null;
  lastPage: number;
}

export const STORAGE_KEY = "comicverse-reader-v2";
export const CHANGE_EVENT = "comicverse-reader-change";
const CACHE = "comicverse-reader-pages";

/** Más grande que esto suele ser un paquete con muchos cómics dentro: no cabe en memoria en una tablet. */
export const MAX_FILE_BYTES = 300 * 1024 * 1024;
export const COMIC_FILE = /\.(cbr|cbz)$/i;

export function listLocalComics(): LocalComic[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as LocalComic[];
  } catch {
    return [];
  }
}

function save(list: LocalComic[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function updateLocalComics(changes: Map<string, Partial<LocalComic>>) {
  save(listLocalComics().map((c) => (changes.has(c.id) ? { ...c, ...changes.get(c.id) } : c)));
}

export const updateLocalComic = (id: string, changes: Partial<LocalComic>) => updateLocalComics(new Map([[id, changes]]));

const pageUrl = (id: string, index: number) => `/reader-pages/${id}/${index}`;

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/** Extrae las páginas del archivo y las guarda en el dispositivo. `onProgress` va de 0 a 1. */
export async function importComicFile(file: File, folder: string, onProgress?: (done: number) => void): Promise<LocalComic> {
  if (file.size > MAX_FILE_BYTES) throw new Error("TOO_BIG");
  // Pide que el navegador no borre estos datos si le falta espacio.
  await navigator.storage?.persist?.().catch(() => false);
  const pages = await readArchivePages(file);
  const id = crypto.randomUUID();
  const cache = await caches.open(CACHE);
  for (const [i, page] of pages.entries()) {
    const ext = page.name.split(".").pop()!.toLowerCase();
    const body = new Blob([page.data as Uint8Array<ArrayBuffer>], { type: MIME[ext] ?? "image/jpeg" });
    await cache.put(pageUrl(id, i), new Response(body, { headers: { "Content-Type": body.type } }));
    onProgress?.((i + 1) / pages.length);
  }
  const comic: LocalComic = {
    id,
    fileName: file.name,
    folder,
    pages: pages.length,
    addedAt: new Date().toISOString(),
    comicId: null,
    comicTitle: null,
    lastPage: 0,
  };
  save([...listLocalComics(), comic]);
  return comic;
}

/** Una página como Blob, para mostrarla con URL.createObjectURL. */
export async function readLocalPage(id: string, index: number): Promise<Blob> {
  const response = await (await caches.open(CACHE)).match(pageUrl(id, index));
  if (!response) throw new Error("PAGE_MISSING");
  return response.blob();
}

export async function deleteLocalComics(ids: string[]) {
  const cache = await caches.open(CACHE);
  const gone = new Set(ids);
  for (const comic of listLocalComics().filter((c) => gone.has(c.id))) {
    for (let i = 0; i < comic.pages; i++) await cache.delete(pageUrl(comic.id, i));
  }
  save(listLocalComics().filter((c) => !gone.has(c.id)));
}

/** Espacio usado por el navegador para esta web (aproximado). */
export async function storageUsage() {
  const estimate = await navigator.storage?.estimate?.();
  return estimate ? { used: estimate.usage ?? 0, quota: estimate.quota ?? 0 } : null;
}

/** Borra lo que guardaba la versión anterior del lector (OPFS + su lista). */
export async function cleanLegacyStorage() {
  if (localStorage.getItem("comicverse-reader-v1") === null) return;
  localStorage.removeItem("comicverse-reader-v1");
  await navigator.storage
    ?.getDirectory?.()
    .then((root) => root.removeEntry("comics", { recursive: true }))
    .catch(() => undefined);
}
