"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { updateLocalComic } from "@/lib/reader/local-library";
import { matchComics } from "@/lib/reader/linking";
import { useLocalComics, usePageUrl } from "@/components/reader/use-local-comics";
import { UnlockPanel, type UnlockView } from "@/components/library/unlock-panel";
import { ArrowIcon } from "@/components/ui/icons";

type Fit = "height" | "width";
const FIT_KEY = "comicverse-reader-fit";

/** Cambia el estado del cómic enlazado en tu biblioteca (la misma API que la ficha). */
async function setStatus(comicId: string, status: "READING" | "READ") {
  const response = await fetch(`/api/v1/library/comics/${comicId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as { unlock: UnlockView | null; achievements?: UnlockView["achievements"] };
}

/**
 * Visor a pantalla completa. Pasar página: tocar los laterales, deslizar o las flechas del
 * teclado; tocar el centro muestra u oculta la barra. Al abrirlo, el cómic enlazado pasa a
 * «Leyendo»; al llegar a la última página, a «Leído» (con sus desbloqueos).
 */
export function ComicViewer({ id }: { id: string }) {
  const comics = useLocalComics();
  const comic = comics?.find((c) => c.id === id) ?? null;
  const [page, setPage] = useState<number | null>(null);
  const [bar, setBar] = useState(true);
  // Tu ajuste preferido (en el servidor no hay localStorage; ahí el visor aún no pinta nada).
  const [fit, setFit] = useState<Fit>(() =>
    typeof window !== "undefined" && localStorage.getItem(FIT_KEY) === "width" ? "width" : "height",
  );
  const [unlock, setUnlock] = useState<UnlockView | null>(null);
  const [syncError, setSyncError] = useState(false);
  // Estado del cómic en tu biblioteca (null = aún no lo sabemos o no está enlazado).
  const libraryStatus = useRef<string | null>(null);
  // Cuando llega ese estado, se vuelve a mirar si ya estás en la última página.
  const [libraryReady, setLibraryReady] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);

  // Hasta que pasas página, la de donde lo dejaste (si ya lo terminaste, desde la portada).
  const current = page ?? (comic && comic.lastPage < comic.pages - 1 ? comic.lastPage : 0);
  const { url, failed } = usePageUrl(comic?.id, current, comic?.pages);
  const { url: nextUrl } = usePageUrl(comic?.id, current + 1, comic?.pages);

  // Sin enlazar: se intenta otra vez al abrirlo (el catálogo puede tener ya su serie).
  const unlinked = comic !== null && !comic.comicId;
  useEffect(() => {
    if (unlinked) void matchComics([comic]).catch(() => undefined);
    // Solo al abrir este cómic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, unlinked]);

  // Al abrir un cómic enlazado: si no estaba leído ni empezado, pasa a «Leyendo».
  const comicId = comic?.comicId ?? null;
  useEffect(() => {
    if (!comicId) return;
    fetch(`/api/v1/library/comics/${comicId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data: { entry: { status: string } | null } | null) => {
        libraryStatus.current = data?.entry?.status ?? "NONE";
        if (libraryStatus.current !== "READ" && libraryStatus.current !== "READING") {
          await setStatus(comicId, "READING");
          libraryStatus.current = "READING";
        }
        setLibraryReady(true);
      })
      .catch(() => setSyncError(true));
  }, [comicId]);

  const goTo = useCallback(
    (target: number) => {
      if (!comic) return;
      const next = Math.max(0, Math.min(comic.pages - 1, target));
      setPage(next);
      updateLocalComic(comic.id, { lastPage: next });
      scroller.current?.scrollTo({ top: 0 });
    },
    [comic],
  );

  // Última página: el cómic enlazado pasa a «Leído».
  useEffect(() => {
    if (!comic || !comicId || current !== comic.pages - 1) return;
    if (libraryStatus.current === null || libraryStatus.current === "READ") return;
    libraryStatus.current = "READ";
    setStatus(comicId, "READ")
      .then((data) => data.unlock && setUnlock({ ...data.unlock, achievements: data.achievements ?? [] }))
      .catch(() => setSyncError(true));
  }, [comic, comicId, current, libraryReady]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(current + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo]);

  if (comics === null) return null;
  if (!comic) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-ink">Este cómic no está en este dispositivo.</p>
        <Link href="/reader" className="mt-2 inline-block text-sm underline">
          Volver al lector
        </Link>
      </main>
    );
  }

  function onTap(e: React.MouseEvent<HTMLDivElement>) {
    // Con zoom de dos dedos, tocar no pasa página (estarías moviéndote por la viñeta).
    if ((window.visualViewport?.scale ?? 1) > 1.05) return;
    const x = e.clientX / window.innerWidth;
    if (x < 0.3) goTo(current - 1);
    else if (x > 0.7) goTo(current + 1);
    else setBar((v) => !v);
  }

  function onSwipeEnd(e: React.PointerEvent) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start === null || (window.visualViewport?.scale ?? 1) > 1.05) return;
    const dx = e.clientX - start;
    if (Math.abs(dx) > 60) goTo(current + (dx < 0 ? 1 : -1));
  }

  const toggleFit = () => {
    const next = fit === "height" ? "width" : "height";
    setFit(next);
    localStorage.setItem(FIT_KEY, next);
  };

  const title = comic.comicTitle ?? comic.fileName;
  const barButton = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-white/90 hover:bg-white/10";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-label={`Leyendo ${title}`}>
      {bar && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-black/75 px-3 py-2 backdrop-blur">
          <Link href="/reader" className={barButton}>
            <ArrowIcon direction="left" size={16} />
            Lector
          </Link>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
          <button type="button" onClick={toggleFit} className={barButton}>
            {fit === "height" ? "Ajustar a ancho" : "Ajustar a alto"}
          </button>
          <button
            type="button"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
            className={`${barButton} hidden sm:inline-flex`}
          >
            Pantalla completa
          </button>
        </div>
      )}

      <div
        ref={scroller}
        onClick={onTap}
        onPointerDown={(e) => (swipeStart.current = e.clientX)}
        onPointerUp={onSwipeEnd}
        className={`flex-1 select-none ${fit === "height" ? "flex items-center justify-center overflow-hidden" : "overflow-y-auto"}`}
      >
        {failed && (
          <p className="max-w-sm p-6 text-center text-sm text-white/80">
            No se ha podido cargar esta página. Prueba a borrar el cómic del lector y añadirlo otra vez.
          </p>
        )}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- página local (blob:), next/image no aporta nada
          <img
            src={url}
            alt={`Página ${current + 1} de ${comic.pages}`}
            draggable={false}
            className={fit === "height" ? "max-h-full max-w-full object-contain" : "mx-auto w-full max-w-5xl"}
          />
        )}
        {/* La siguiente página se carga por adelantado para que pasar sea instantáneo. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {nextUrl && <img src={nextUrl} alt="" aria-hidden="true" className="hidden" />}
      </div>

      {/* Al terminar: lo que has desbloqueado, en una capa propia sobre la última página. */}
      {unlock && (
        <div className="absolute inset-x-4 top-16 bottom-28 z-20 mx-auto max-w-md overflow-y-auto rounded-2xl bg-paper text-ink shadow-2xl">
          <UnlockPanel unlock={unlock} onClose={() => setUnlock(null)} />
        </div>
      )}

      {bar && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-black/75 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          {syncError && (
            <p className="mb-2 text-center text-xs text-white/70">
              No se ha podido actualizar tu biblioteca; la lectura sigue guardada en este dispositivo.
            </p>
          )}
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Página anterior" className={`${barButton} disabled:opacity-30`}>
              <ArrowIcon direction="left" size={18} />
            </button>
            <input
              type="range"
              min={1}
              max={comic.pages}
              value={current + 1}
              onChange={(e) => goTo(Number(e.target.value) - 1)}
              aria-label="Ir a la página"
              className="flex-1 accent-editor"
            />
            <span className="w-16 text-center text-sm tabular-nums">
              {current + 1}/{comic.pages}
            </span>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current === comic.pages - 1}
              aria-label="Página siguiente"
              className={`${barButton} disabled:opacity-30`}
            >
              <ArrowIcon size={18} />
            </button>
          </div>
          {!comic.comicId && (
            <p className="mt-1 text-center text-xs text-white/60">Sin enlazar con el catálogo: no cuenta para tu biblioteca.</p>
          )}
        </div>
      )}
    </div>
  );
}
