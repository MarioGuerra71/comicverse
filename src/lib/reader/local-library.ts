// La estantería del lector vive solo en este dispositivo: las páginas, en el almacenamiento
// privado del navegador (OPFS, «comics/<id>/0001.jpg»); la ficha de cada cómic, en localStorage.
// Nada de esto se sube al servidor.
import { readArchivePages } from "@/lib/reader/archive";

export interface LocalComic {
  id: string;
  fileName: string;
  pages: number;
  /** Extensión de cada página, en orden («jpg», «png»…). */
  extensions: string[];
  addedAt: string;
  /** Cómic del catálogo con el que está enlazado. */
  comicId: string | null;
  comicTitle: string | null;
  lastPage: number;
}

const KEY = "comicverse-reader-v1";
export const CHANGE_EVENT = "comicverse-reader-change";

export function listLocalComics(): LocalComic[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalComic[];
  } catch {
    return [];
  }
}

function save(list: LocalComic[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function updateLocalComic(id: string, changes: Partial<LocalComic>) {
  save(listLocalComics().map((c) => (c.id === id ? { ...c, ...changes } : c)));
}

export const findLocalComic = (id: string) => listLocalComics().find((c) => c.id === id) ?? null;
export const findByComicId = (comicId: string) => listLocalComics().find((c) => c.comicId === comicId) ?? null;

const comicsDir = async () =>
  (await navigator.storage.getDirectory()).getDirectoryHandle("comics", { create: true });

const pageName = (index: number, ext: string) => `${String(index + 1).padStart(4, "0")}.${ext}`;

/** Extrae las páginas del archivo y las guarda en el dispositivo. `onProgress` va de 0 a 1. */
export async function importComicFile(file: File, onProgress?: (done: number) => void): Promise<LocalComic> {
  // Pide que el navegador no borre estos datos si le falta espacio.
  await navigator.storage.persist?.().catch(() => false);
  const pages = await readArchivePages(file);
  const id = crypto.randomUUID();
  const dir = await (await comicsDir()).getDirectoryHandle(id, { create: true });
  const extensions: string[] = [];
  for (const [i, page] of pages.entries()) {
    const ext = page.name.split(".").pop()!.toLowerCase();
    extensions.push(ext);
    const writable = await (await dir.getFileHandle(pageName(i, ext), { create: true })).createWritable();
    await writable.write(page.data as Uint8Array<ArrayBuffer>);
    await writable.close();
    onProgress?.((i + 1) / pages.length);
  }
  const comic: LocalComic = {
    id,
    fileName: file.name,
    pages: pages.length,
    extensions,
    addedAt: new Date().toISOString(),
    comicId: null,
    comicTitle: null,
    lastPage: 0,
  };
  save([comic, ...listLocalComics()]);
  return comic;
}

/** Una página como archivo, para mostrarla con URL.createObjectURL. */
export async function readLocalPage(id: string, index: number, ext: string): Promise<File> {
  const dir = await (await comicsDir()).getDirectoryHandle(id);
  return (await dir.getFileHandle(pageName(index, ext))).getFile();
}

export async function deleteLocalComic(id: string) {
  await (await comicsDir()).removeEntry(id, { recursive: true }).catch(() => undefined);
  save(listLocalComics().filter((c) => c.id !== id));
}
