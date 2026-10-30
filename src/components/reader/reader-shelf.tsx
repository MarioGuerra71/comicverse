"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { naturalCompare, parseComicFileName, seriesKey } from "@/lib/reader/filename";
import {
  cleanLegacyStorage,
  COMIC_FILE,
  deleteLocalComics,
  importComicFile,
  listLocalComics,
  MAX_FILE_BYTES,
  storageUsage,
  updateLocalComic,
  type LocalComic,
} from "@/lib/reader/local-library";
import {
  autoLink,
  importRemote,
  matchComics,
  searchCandidates,
  searchRemote,
  type Candidate,
  type RemoteSeries,
} from "@/lib/reader/linking";
import { useLocalComics, usePageUrl } from "@/components/reader/use-local-comics";
import { FolderIcon } from "@/components/ui/icons";
import { inkButton, inkField, outlineButton } from "@/components/ui/page-parts";

const folderHref = (path: string) => (path ? `/reader?carpeta=${encodeURIComponent(path)}` : "/reader");
const join = (...parts: string[]) => parts.filter(Boolean).join("/");
const title = (c: LocalComic) => c.comicTitle ?? c.fileName.replace(/\.[^.]+$/, "");
const isInside = (c: LocalComic, path: string) => !path || c.folder === path || c.folder.startsWith(`${path}/`);
const quietButton = "inline-flex min-h-11 items-center text-ink-soft underline-offset-4 hover:text-ink hover:underline";

const ERRORS: Record<string, string> = {
  UNSUPPORTED_FORMAT: "no es un .cbz ni un .cbr",
  NO_PAGES: "no tiene páginas",
  TOO_BIG: "demasiado grande",
};

/** Estantería del lector: carpetas como las tuyas, importación, enlace automático y visor. */
export function ReaderShelf({ folder }: { folder: string }) {
  const comics = useLocalComics();
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linking, setLinking] = useState<LocalComic | null>(null);
  const [moving, setMoving] = useState<LocalComic | null>(null);
  const [usage, setUsage] = useState<string | null>(null);

  // Los de la carpeta abierta (en orden natural: #2 antes que #10) y sus subcarpetas.
  const here = useMemo(
    () => (comics ?? []).filter((c) => c.folder === folder).sort((a, b) => naturalCompare(a.fileName, b.fileName)),
    [comics, folder],
  );
  const subfolders = useMemo(() => {
    const names = new Map<string, LocalComic[]>();
    for (const c of comics ?? []) {
      if (!isInside(c, folder) || c.folder === folder) continue;
      const name = c.folder.slice(folder ? folder.length + 1 : 0).split("/")[0];
      names.set(name, [...(names.get(name) ?? []), c]);
    }
    return [...names].sort(([a], [b]) => naturalCompare(a, b));
  }, [comics, folder]);

  // Espacio ocupado (se recalcula al añadir o borrar).
  const count = comics?.length;
  useEffect(() => {
    storageUsage().then(
      (u) => u && setUsage(`${(u.used / 1024 ** 3).toFixed(1)} GB usados de ${(u.quota / 1024 ** 3).toFixed(0)} GB disponibles`),
    );
  }, [count]);
  // Al entrar: limpiar la versión anterior y enlazar lo que quedó pendiente (una vez por sesión).
  const loaded = comics !== null;
  useEffect(() => {
    if (!loaded) return;
    void cleanLegacyStorage();
    if (sessionStorage.getItem("reader-autolink")) return;
    sessionStorage.setItem("reader-autolink", "1");
    void autoLink(listLocalComics(), setStatus).then((left) =>
      setStatus(left ? `${left} sin enlazar: toca «Enlazar» para elegirlos.` : null),
    );
  }, [loaded]);

  async function importFiles(fileList: FileList, keepFolders: boolean) {
    setBusy(true);
    const files = [...fileList];
    const valid = files.filter((f) => COMIC_FILE.test(f.name) && f.size <= MAX_FILE_BYTES);
    const skipped = files.length - valid.length;
    const failed: string[] = [];
    const added: LocalComic[] = [];
    for (const [i, file] of valid.entries()) {
      const label = valid.length > 1 ? `(${i + 1}/${valid.length}) ` : "";
      // Carpeta: la de tu ordenador (al añadir una carpeta), la abierta o, desde la raíz, una por serie.
      const relative = keepFolders ? file.webkitRelativePath.split("/").slice(0, -1).join("/") : "";
      const target = keepFolders ? join(folder, relative) : folder || parseComicFileName(file.name).series;
      try {
        setStatus(`${label}Abriendo ${file.name}…`);
        added.push(
          await importComicFile(file, target, (done) => setStatus(`${label}Guardando ${file.name}: ${Math.round(done * 100)} %`)),
        );
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        failed.push(`${file.name} (${ERRORS[code] ?? "no se ha podido abrir"})`);
      }
    }
    const left = await autoLink(added, setStatus);
    setStatus(
      [
        `${added.length} ${added.length === 1 ? "cómic añadido" : "cómics añadidos"}.`,
        left > 0 && `${left} sin enlazar: toca «Enlazar» para elegirlos.`,
        skipped > 0 && `${skipped} archivos saltados (no son .cbr/.cbz o pasan de ${MAX_FILE_BYTES / 1024 ** 2} MB).`,
        failed.length > 0 && `No se han podido abrir: ${failed.join(", ")}.`,
      ]
        .filter(Boolean)
        .join(" "),
    );
    setBusy(false);
    for (const input of [filesInput.current, folderInput.current]) if (input) input.value = "";
  }

  function newFolder() {
    const name = prompt("Nombre de la carpeta nueva:")?.trim().replace(/\//g, "-");
    if (name) window.location.assign(folderHref(join(folder, name)));
  }

  async function deleteFolder() {
    const inside = (comics ?? []).filter((c) => isInside(c, folder));
    if (!confirm(`¿Borrar «${folder}» y sus ${inside.length} cómics de este dispositivo?`)) return;
    await deleteLocalComics(inside.map((c) => c.id));
    window.location.assign(folderHref(folder.split("/").slice(0, -1).join("/")));
  }

  const crumbs = folder ? folder.split("/") : [];

  return (
    <>
      {/* Migas: Lector / DC UNIVERSO ABSOLUTE / Absolute Batman */}
      <nav aria-label="Carpetas" className="mt-4 flex flex-wrap items-center gap-x-2 text-sm">
        <Link href="/reader" className={quietButton}>
          Lector
        </Link>
        {crumbs.map((name, i) => (
          <span key={i} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-ink-soft">
              /
            </span>
            {i === crumbs.length - 1 ? (
              <span className="font-semibold text-ink">{name}</span>
            ) : (
              <Link href={folderHref(crumbs.slice(0, i + 1).join("/"))} className={quietButton}>
                {name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Sin `accept`: Android filtra por tipo de archivo y no conoce .cbr; se filtra aquí. */}
        <input
          ref={filesInput}
          id="reader-files"
          type="file"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(e) => e.target.files?.length && importFiles(e.target.files, false)}
        />
        <label htmlFor="reader-files" className={`${inkButton} cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
          Añadir cómics
        </label>
        <input
          ref={folderInput}
          id="reader-folder"
          type="file"
          multiple
          className="sr-only"
          disabled={busy}
          // @ts-expect-error -- atributo no estándar (lo entienden todos los navegadores) para elegir una carpeta
          webkitdirectory=""
          onChange={(e) => e.target.files?.length && importFiles(e.target.files, true)}
        />
        <label htmlFor="reader-folder" className={`${outlineButton} cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
          Añadir carpeta
        </label>
        <button type="button" onClick={newFolder} className={quietButton} disabled={busy}>
          Nueva carpeta
        </button>
        {folder && (
          <button type="button" onClick={deleteFolder} className={quietButton} disabled={busy}>
            Borrar carpeta
          </button>
        )}
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-ink">
        {status}
      </p>

      {comics && here.length === 0 && subfolders.length === 0 && !busy && (
        <p className="mt-8 max-w-prose text-ink-soft">
          {folder
            ? "Carpeta vacía: añade aquí tus cómics."
            : "Añade tus .cbr y .cbz (o una carpeta entera). Se guardan solo en este dispositivo y se enlazan solos con el catálogo: al terminarlos se marcan como leídos."}
        </p>
      )}

      {subfolders.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {subfolders.map(([name, inside]) => (
            <FolderItem key={name} name={name} href={folderHref(join(folder, name))} comics={inside} />
          ))}
        </ul>
      )}

      {here.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {here.map((comic) => (
            <ShelfItem key={comic.id} comic={comic} onLink={() => setLinking(comic)} onMove={() => setMoving(comic)} />
          ))}
        </ul>
      )}

      {usage && <p className="mt-12 text-xs text-ink-soft">Almacenamiento de este dispositivo: {usage}.</p>}

      {linking && <LinkDialog comic={linking} onClose={() => setLinking(null)} />}
      {moving && <MoveDialog comic={moving} folders={allFolders(comics ?? [])} onClose={() => setMoving(null)} />}
    </>
  );
}

function allFolders(comics: LocalComic[]) {
  const set = new Set<string>();
  for (const c of comics) {
    const parts = c.folder.split("/").filter(Boolean);
    parts.forEach((_, i) => set.add(parts.slice(0, i + 1).join("/")));
  }
  return [...set].sort(naturalCompare);
}

function Cover({ comic, className = "" }: { comic: LocalComic | undefined; className?: string }) {
  const { url, failed } = usePageUrl(comic?.id, 0, comic?.pages);
  return (
    <span className={`relative block aspect-2/3 overflow-hidden rounded-lg bg-sheet ring-1 ring-edge ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagen local (blob:), next/image no aporta nada
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        failed && <span className="flex h-full items-center justify-center p-2 text-center text-xs text-ink-soft">Sin imagen</span>
      )}
    </span>
  );
}

function FolderItem({ name, href, comics }: { name: string; href: string; comics: LocalComic[] }) {
  const first = [...comics].sort((a, b) => naturalCompare(a.folder + a.fileName, b.folder + b.fileName))[0];
  const finished = comics.filter((c) => c.lastPage >= c.pages - 1).length;
  return (
    <li>
      <Link href={href} className="group block">
        <span className="relative block">
          <Cover comic={first} className="opacity-90 transition-opacity group-hover:opacity-100" />
          <span className="absolute top-2 left-2 rounded-full bg-black/70 p-1.5 text-white">
            <FolderIcon size={16} />
          </span>
        </span>
        <span className="mt-3 block text-sm leading-tight font-bold break-words text-ink">{name}</span>
        <span className="mt-1 block text-xs text-ink-soft tabular-nums">
          {comics.length} {comics.length === 1 ? "cómic" : "cómics"} · {finished} terminados
        </span>
      </Link>
    </li>
  );
}

function ShelfItem({ comic, onLink, onMove }: { comic: LocalComic; onLink: () => void; onMove: () => void }) {
  const read = Math.min(comic.lastPage + 1, comic.pages);
  const percent = Math.round((read / comic.pages) * 100);
  return (
    <li>
      <Link href={`/reader/${comic.id}`} className="group block rounded-lg" aria-label={`Leer ${title(comic)}`}>
        <Cover comic={comic} className="transition-transform duration-300 group-hover:scale-[1.02]" />
        <span className="mt-3 block text-sm leading-tight font-bold break-words text-ink">{title(comic)}</span>
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
        <button type="button" onClick={onLink} className={comic.comicId ? quietButton : `${quietButton} text-editor-ink`}>
          {comic.comicId ? "Enlace" : "Enlazar"}
        </button>
        <button type="button" onClick={onMove} className={quietButton}>
          Mover
        </button>
        <button
          type="button"
          onClick={() => confirm(`¿Borrar «${title(comic)}» de este dispositivo?`) && deleteLocalComics([comic.id])}
          className={quietButton}
        >
          Borrar
        </button>
      </div>
    </li>
  );
}

/** Modal nativo: fondo oscuro, foco atrapado y Escape para cerrar sin código propio. */
function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => dialog.current?.showModal(), []);
  return (
    <dialog
      ref={dialog}
      aria-label={label}
      onClose={onClose}
      className="m-auto max-h-[85vh] w-[min(36rem,92vw)] overflow-y-auto rounded-2xl bg-paper-raised p-5 text-ink ring-1 ring-edge backdrop:bg-black/70"
    >
      <h2 className="font-display text-xl font-extrabold tracking-wide uppercase">{label}</h2>
      {children}
      <div className="mt-5 text-right">
        <button type="button" onClick={onClose} className="min-h-11 text-sm font-semibold underline-offset-4 hover:underline">
          Cerrar
        </button>
      </div>
    </dialog>
  );
}

/** Elegir a mano el cómic del catálogo: sale ya con opciones y puede aplicarse a toda la carpeta. */
function LinkDialog({ comic, onClose }: { comic: LocalComic; onClose: () => void }) {
  const parsed = parseComicFileName(comic.fileName, comic.folder);
  const initial = parsed.issue ? `${parsed.series} ${parsed.issue}` : parsed.series;
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<Candidate[] | null>(null);
  const [applyToFolder, setApplyToFolder] = useState(true);
  const comics = useLocalComics() ?? [];
  // Los demás sin enlazar de esta carpeta con la misma serie (se enlazan a la misma al elegir).
  const siblings = comics.filter(
    (c) =>
      c.id !== comic.id &&
      !c.comicId &&
      c.folder === comic.folder &&
      seriesKey(parseComicFileName(c.fileName).series) === seriesKey(parsed.series),
  );

  // Al abrir, ya con las opciones del nombre del archivo.
  useEffect(() => {
    let cancelled = false;
    searchCandidates(initial).then((r) => !cancelled && setResults(r));
    return () => {
      cancelled = true;
    };
  }, [initial]);

  async function search(text: string) {
    setResults(null);
    setResults(await searchCandidates(text));
  }

  // Comic Vine: para cuando el catálogo no tiene la serie (o no es ninguna de las que salen).
  const [remote, setRemote] = useState<RemoteSeries[] | string | null>(null);
  async function findRemote() {
    setRemote("Buscando en Comic Vine…");
    const found = await searchRemote(q);
    setRemote(
      found === "RATE_LIMITED"
        ? "Has buscado mucho en Comic Vine esta hora; prueba más tarde."
        : found === "ERROR"
          ? "Comic Vine no responde ahora mismo."
          : found,
    );
  }
  async function chooseRemote(series: RemoteSeries) {
    setRemote(`Trayendo ${series.name} (${series.startYear ?? "?"})…`);
    const seriesId = await importRemote(series);
    if (!seriesId) return setRemote("No se ha podido traer la serie (¿límite por hora?). Prueba más tarde.");
    const [result] = await matchComics([comic], seriesId);
    if (!result?.match) return setRemote(`${series.name} no tiene el número ${parsed.issue ?? "de este archivo"}.`);
    if (applyToFolder && siblings.length) await matchComics(siblings, seriesId);
    onClose();
  }

  async function choose(match: Candidate | null) {
    updateLocalComic(comic.id, { comicId: match?.comicId ?? null, comicTitle: match?.title ?? null });
    if (match && applyToFolder && siblings.length) await matchComics(siblings, match.seriesId);
    onClose();
  }

  return (
    <Modal label="Enlazar con el catálogo" onClose={onClose}>
      <p className="mt-1 text-xs break-words text-ink-soft">
        {comic.folder ? `${comic.folder} / ` : ""}
        {comic.fileName}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search(q);
        }}
        className="mt-4 flex gap-2"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el catálogo" className={`${inkField} flex-1`} />
        <button type="submit" className={inkButton}>
          Buscar
        </button>
      </form>
      {siblings.length > 0 && (
        <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={applyToFolder} onChange={(e) => setApplyToFolder(e.target.checked)} />
          Enlazar también los otros {siblings.length} de esta carpeta con la misma serie
        </label>
      )}
      <ul className="mt-3 flex flex-col">
        {results === null && <li className="text-sm text-ink-soft">Buscando…</li>}
        {results?.length === 0 && <li className="text-sm text-ink-soft">El catálogo no tiene este cómic.</li>}
        {results?.map((r) => (
          <li key={r.comicId}>
            <button
              type="button"
              onClick={() => choose(r)}
              className="flex min-h-11 w-full items-baseline justify-between gap-3 border-b border-line py-2 text-left text-sm hover:text-editor-ink"
            >
              <span>
                <span className="font-semibold">{r.title}</span>
                <span className="block text-xs text-ink-soft">
                  Serie {r.seriesName} ({r.startYear ?? "?"}){r.owned && " · en tu biblioteca"}
                </span>
              </span>
              <span className="shrink-0 text-xs text-ink-soft">{r.releaseYear ?? ""}</span>
            </button>
          </li>
        ))}
      </ul>
      {/* ¿No está o no es ninguno? Elegir la serie en Comic Vine: se trae y se enlaza. */}
      {remote === null ? (
        <button type="button" onClick={findRemote} className={`${outlineButton} mt-4`}>
          Buscar la serie en Comic Vine
        </button>
      ) : typeof remote === "string" ? (
        <p className="mt-4 text-sm text-ink-soft" aria-live="polite">
          {remote}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          <li className="text-xs tracking-wide text-ink-soft uppercase">Series en Comic Vine</li>
          {remote.length === 0 && <li className="text-sm text-ink-soft">Ninguna de Marvel o DC con ese nombre.</li>}
          {remote.map((r) => (
            <li key={r.externalId}>
              <button
                type="button"
                onClick={() => chooseRemote(r)}
                className="flex min-h-11 w-full items-baseline justify-between gap-3 border-b border-line py-2 text-left text-sm hover:text-editor-ink"
              >
                <span className="font-semibold">
                  {r.name} ({r.startYear ?? "?"})
                </span>
                <span className="shrink-0 text-xs text-ink-soft">
                  {r.issueCount} números{r.seriesId ? " · ya en el catálogo" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {comic.comicId && (
        <button type="button" onClick={() => choose(null)} className={`${quietButton} mt-3 text-sm`}>
          Quitar enlace
        </button>
      )}
    </Modal>
  );
}

function MoveDialog({ comic, folders, onClose }: { comic: LocalComic; folders: string[]; onClose: () => void }) {
  const [name, setName] = useState("");
  const move = (folder: string) => {
    updateLocalComic(comic.id, { folder });
    onClose();
  };
  return (
    <Modal label="Mover a otra carpeta" onClose={onClose}>
      <p className="mt-1 text-xs break-words text-ink-soft">{title(comic)}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) move(name.trim().replace(/\s*\/\s*/g, "/"));
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Carpeta nueva (p. ej. DC/Batman)"
          aria-label="Carpeta nueva"
          className={`${inkField} flex-1`}
        />
        <button type="submit" className={inkButton}>
          Mover
        </button>
      </form>
      <ul className="mt-3 flex flex-col">
        {["", ...folders]
          .filter((f) => f !== comic.folder)
          .map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => move(f)}
                className="flex min-h-11 w-full items-center gap-2 border-b border-line text-left text-sm hover:text-editor-ink"
              >
                <FolderIcon size={16} />
                {f || "Lector (sin carpeta)"}
              </button>
            </li>
          ))}
      </ul>
    </Modal>
  );
}
