"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { parseComicFileName, pickBestMatch, searchQuery } from "@/lib/reader/filename";
import {
  deleteLocalComic,
  importComicFile,
  updateLocalComic,
  type LocalComic,
} from "@/lib/reader/local-library";
import { useLocalComics, usePageUrl } from "@/components/reader/use-local-comics";
import { inkButton, inkField } from "@/components/ui/page-parts";

interface CatalogComic {
  id: string;
  title: string;
  releaseDate: string | null;
  coverThumbUrl: string | null;
  series: { name: string; startYear: number | null };
}

async function searchCatalog(q: string): Promise<CatalogComic[]> {
  const query = new URLSearchParams({ q: q.slice(0, 100), pageSize: "20", sort: "release_asc" });
  const response = await fetch(`/api/v1/comics?${query}`);
  if (!response.ok) return [];
  return ((await response.json()) as { items: CatalogComic[] }).items;
}

const ERRORS: Record<string, string> = {
  UNSUPPORTED_FORMAT: "no es un .cbz ni un .cbr",
  NO_PAGES: "no tiene páginas",
};

/** Estantería del lector: importa archivos, los enlaza con el catálogo y abre el visor. */
export function ReaderShelf() {
  const comics = useLocalComics();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linking, setLinking] = useState<LocalComic | null>(null);

  async function importFiles(files: FileList) {
    setBusy(true);
    const failed: string[] = [];
    for (const [i, file] of [...files].entries()) {
      const label = files.length > 1 ? `(${i + 1}/${files.length}) ` : "";
      try {
        setStatus(`${label}Abriendo ${file.name}…`);
        const comic = await importComicFile(file, (done) =>
          setStatus(`${label}Guardando ${file.name}: ${Math.round(done * 100)} %`),
        );
        // Enlace automático si el catálogo tiene un título exacto (y, si hay varios, el del año).
        const parsed = parseComicFileName(file.name);
        const match = pickBestMatch(await searchCatalog(searchQuery(parsed)), parsed);
        if (match) updateLocalComic(comic.id, { comicId: match.id, comicTitle: match.title });
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        failed.push(`${file.name} (${ERRORS[code] ?? "no se ha podido abrir"})`);
      }
    }
    setStatus(failed.length ? `No se han importado: ${failed.join(", ")}.` : null);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input
          ref={input}
          type="file"
          multiple
          accept=".cbr,.cbz,.rar,.zip"
          className="sr-only"
          id="reader-import"
          onChange={(e) => e.target.files?.length && importFiles(e.target.files)}
          disabled={busy}
        />
        <label htmlFor="reader-import" className={`${inkButton} cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
          Añadir cómics (.cbr, .cbz)
        </label>
        <p aria-live="polite" className="text-sm text-ink-soft">
          {status}
        </p>
      </div>
      <p className="mt-3 max-w-prose text-xs text-ink-soft">
        Los archivos se guardan solo en este dispositivo; no se suben a ningún sitio. Si el nombre del archivo
        coincide con un cómic del catálogo, se enlaza solo: al terminarlo se marcará como leído.
      </p>

      {comics && comics.length === 0 && !busy && (
        <p className="mt-10 text-ink">Aún no has añadido ningún cómic a este dispositivo.</p>
      )}

      <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {comics?.map((comic) => (
          <ShelfItem key={comic.id} comic={comic} onLink={() => setLinking(comic)} />
        ))}
      </ul>

      {linking && <LinkDialog comic={linking} onClose={() => setLinking(null)} />}
    </>
  );
}

function ShelfItem({ comic, onLink }: { comic: LocalComic; onLink: () => void }) {
  const cover = usePageUrl(comic, 0);
  const read = comic.lastPage + 1;
  const percent = Math.round((read / comic.pages) * 100);
  return (
    <li>
      <Link href={`/reader/${comic.id}`} className="group block rounded-lg" aria-label={`Leer ${comic.comicTitle ?? comic.fileName}`}>
        <span className="relative block aspect-2/3 overflow-hidden rounded-lg bg-sheet ring-1 ring-edge">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element -- imagen local (blob:), next/image no aporta nada
            <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          )}
        </span>
        <span className="mt-3 block text-sm leading-tight font-bold break-words text-ink">
          {comic.comicTitle ?? comic.fileName}
        </span>
      </Link>
      <div className="mt-1 flex items-baseline justify-between gap-2 text-xs text-ink-soft tabular-nums">
        <span>
          pág. {read}/{comic.pages}
        </span>
        <span>{percent} %</span>
      </div>
      <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-sheet-raised" aria-hidden="true">
        <div className="h-full rounded-full bg-ink-soft" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
        {comic.comicId ? (
          <Link href={`/comics/${comic.comicId}`} className="inline-flex min-h-11 items-center text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            Ficha
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center text-editor-ink">Sin enlazar</span>
        )}
        <button type="button" onClick={onLink} className="min-h-11 text-ink-soft underline-offset-4 hover:text-ink hover:underline">
          {comic.comicId ? "Enlace" : "Enlazar"}
        </button>
        <button
          type="button"
          onClick={() => confirm(`¿Borrar «${comic.comicTitle ?? comic.fileName}» de este dispositivo?`) && deleteLocalComic(comic.id)}
          className="min-h-11 text-ink-soft underline-offset-4 hover:text-ink hover:underline"
        >
          Borrar
        </button>
      </div>
    </li>
  );
}

/** Buscar a mano el cómic del catálogo (si el nombre del archivo no bastaba). */
function LinkDialog({ comic, onClose }: { comic: LocalComic; onClose: () => void }) {
  const [q, setQ] = useState(() => searchQuery(parseComicFileName(comic.fileName)));
  const [results, setResults] = useState<CatalogComic[] | null>(null);
  const [searching, setSearching] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  // Modal nativo: fondo oscuro, foco atrapado y Escape para cerrar sin código propio.
  useEffect(() => dialog.current?.showModal(), []);

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    setSearching(true);
    setResults(await searchCatalog(q));
    setSearching(false);
  }

  function choose(match: CatalogComic | null) {
    updateLocalComic(comic.id, { comicId: match?.id ?? null, comicTitle: match?.title ?? null });
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="link-heading"
      onClose={onClose}
      className="m-auto max-h-[85vh] w-[min(36rem,92vw)] overflow-y-auto rounded-2xl bg-sheet p-5 text-ink ring-1 ring-edge backdrop:bg-black/70"
    >
      <h2 id="link-heading" className="font-display text-xl font-extrabold tracking-wide uppercase">
        Enlazar con el catálogo
      </h2>
      <p className="mt-1 text-xs break-words text-ink-soft">{comic.fileName}</p>
      <form onSubmit={search} className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el catálogo" className={`${inkField} flex-1`} />
        <button type="submit" className={inkButton} disabled={searching}>
          Buscar
        </button>
      </form>
      {results && (
        <ul className="mt-4 flex flex-col">
          {results.length === 0 && <li className="text-sm text-ink-soft">Sin resultados. Prueba solo con el nombre de la serie.</li>}
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="flex min-h-11 w-full items-baseline justify-between gap-3 border-b border-line py-2 text-left text-sm hover:text-editor-ink"
              >
                <span className="font-semibold">{r.title}</span>
                <span className="shrink-0 text-xs text-ink-soft">{r.releaseDate?.slice(0, 4) ?? r.series.startYear ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex justify-between gap-3 text-sm">
        {comic.comicId ? (
          <button type="button" onClick={() => choose(null)} className="min-h-11 text-ink-soft underline-offset-4 hover:underline">
            Quitar enlace
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={onClose} className="min-h-11 font-semibold underline-offset-4 hover:underline">
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
