"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { AlbumSlot, CollectionCardDto } from "@/server/dto/character";
import { CardViewer } from "@/components/collection/card-viewer";

const PER_PAGE = 9;
const FLIP_MS = 650;
const pad = (n: number) => String(n).padStart(3, "0");

type Page = { index: number; slots: AlbumSlot[] };

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Una funda del archivador: la carta (si está descubierta), el hueco a lápiz o la funda vacía. */
function Pocket({
  slot,
  highlighted,
  onOpen,
}: {
  slot: AlbumSlot | null;
  highlighted: boolean;
  onOpen: (card: CollectionCardDto, from: DOMRect) => void;
}) {
  const sleeve = "relative flex flex-col border border-line-strong bg-paper p-1.5";
  if (!slot) return <div className={`${sleeve} aspect-[3/4.6]`} aria-hidden="true" />;

  if (slot.kind === "locked") {
    return (
      <div className={`${sleeve} aspect-[3/4.6]`} aria-label={`Nº ${pad(slot.number)}: personaje por descubrir`}>
        <div className="relative flex-1 border-[1.5px] border-blue bg-sheet">
          <svg viewBox="0 0 30 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-blue" aria-hidden="true">
            <path d="M0 0 30 40M30 0 0 40" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <span className="mt-1 font-hand text-lg leading-none font-bold text-blue-ink">{pad(slot.number)}</span>
      </div>
    );
  }

  const { card } = slot;
  return (
    <button
      type="button"
      data-card={card.id}
      onClick={(event) => {
        const art = (event.currentTarget.querySelector("[data-art]") as HTMLElement).getBoundingClientRect();
        onOpen(card, art);
      }}
      aria-label={`Ver en grande ${pad(card.number ?? 0)} ${card.name}`}
      className={`group ${sleeve} aspect-[3/4.6] text-left transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1 ${
        highlighted ? "outline-2 outline-offset-4 outline-editor motion-safe:animate-pulse" : ""
      }`}
    >
      <span
        data-art
        className={`relative block flex-1 overflow-hidden border-2 border-ink bg-sheet ${
          card.isNew ? "outline-2 outline-offset-2 outline-editor" : ""
        }`}
      >
        {card.imageThumbUrl ? (
          <Image src={card.imageThumbUrl} alt="" fill unoptimized sizes="180px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-ink-soft">Sin imagen</span>
        )}
      </span>
      <span className="mt-1 flex items-baseline justify-between gap-1">
        <span className="truncate text-xs leading-tight font-bold text-ink">{card.name}</span>
        {/* En el móvil el número ya va en la cabecera de la página: más sitio para el nombre. */}
        <span className="hidden shrink-0 font-hand text-lg leading-none font-bold text-ink sm:inline">
          {pad(card.number ?? 0)}
        </span>
      </span>
      {card.isNew && (
        <span className="absolute -top-2 -right-1 rotate-3 border-2 border-ink bg-sheet px-1 font-hand text-sm leading-tight font-bold text-editor-ink">
          ¡nuevo!
        </span>
      )}
    </button>
  );
}

/** Una página del archivador: cabecera y fundas de 3×3. */
function BinderPage({
  page,
  total,
  highlight,
  onOpen,
}: {
  page: Page | undefined;
  total: number;
  highlight: string | null;
  onOpen: (card: CollectionCardDto, from: DOMRect) => void;
}) {
  if (!page) return <div className="h-full border-2 border-ink bg-sheet" aria-hidden="true" />;
  const numbers = page.slots.map((s) => (s.kind === "card" ? (s.card.number ?? 0) : s.number));
  const filled = page.slots.filter((s) => s.kind === "card").length;
  return (
    <section aria-label={`Página ${page.index + 1}`} className="flex h-full flex-col border-2 border-ink bg-sheet p-3 sm:p-4">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-bold tracking-wide text-ink">Página {page.index + 1}</h2>
        <span className="font-hand text-lg leading-none font-bold text-ink-soft">
          {numbers.length ? `${pad(Math.min(...numbers))}–${pad(Math.max(...numbers))}` : ""} · {filled}/
          {page.slots.length}
        </span>
      </header>
      <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: PER_PAGE }, (_, i) => {
          const slot = page.slots[i] ?? null;
          return (
            <Pocket
              key={slot ? (slot.kind === "card" ? slot.card.id : `l${slot.number}`) : `e${i}`}
              slot={slot}
              highlighted={!!slot && slot.kind === "card" && slot.card.id === highlight}
              onOpen={onOpen}
            />
          );
        })}
      </div>
    </section>
  );
}

/** Anillas del lomo. */
function Rings() {
  return (
    <div className="relative hidden w-10 shrink-0 md:block" aria-hidden="true">
      <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-ink" />
      {["18%", "50%", "82%"].map((top) => (
        <svg key={top} viewBox="0 0 48 24" className="absolute left-1/2 h-6 w-12 -translate-x-1/2 -translate-y-1/2 text-ink" style={{ top }}>
          <ellipse cx="24" cy="12" rx="21" ry="8" fill="var(--paper)" stroke="currentColor" strokeWidth="2.5" />
          <ellipse cx="24" cy="12" rx="13" ry="3.5" fill="var(--sheet-raised)" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Archivador de un álbum (mecánica inspirada en los álbumes de cartas: fundas de 3×3, doble
 * página con anillas, hoja que gira al pasar página). En el móvil, una página cada vez.
 */
export function AlbumBinder({ slots, total }: { slots: AlbumSlot[]; total: number }) {
  const [perView, setPerView] = useState(2);
  const [spread, setSpread] = useState(0);
  const [onlyMine, setOnlyMine] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [flip, setFlip] = useState<{ dir: 1 | -1; to: number } | null>(null);
  const [viewer, setViewer] = useState<{ card: CollectionCardDto; from: DOMRect } | null>(null);
  const leaf = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setPerView(media.matches ? 2 : 1);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const visible = useMemo(() => (onlyMine ? slots.filter((s) => s.kind === "card") : slots), [slots, onlyMine]);
  const pages = useMemo(() => {
    const result: Page[] = [];
    for (let i = 0; i < visible.length; i += PER_PAGE) result.push({ index: result.length, slots: visible.slice(i, i + PER_PAGE) });
    return result.length ? result : [{ index: 0, slots: [] }];
  }, [visible]);
  const spreads = Math.max(1, Math.ceil(pages.length / perView));
  const current = Math.min(spread, spreads - 1);
  const pagesOf = (s: number) => pages.slice(s * perView, s * perView + perView);

  function go(to: number) {
    if (to < 0 || to >= spreads || to === current || flip) return;
    if (reducedMotion()) return setSpread(to);
    setFlip({ dir: to > current ? 1 : -1, to });
  }

  // La hoja que gira: al terminar, el archivador pasa a la nueva doble página.
  useEffect(() => {
    if (!flip || !leaf.current) return;
    const animation = leaf.current.animate(
      flip.dir === 1
        ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }]
        : [{ transform: "rotateY(-180deg)" }, { transform: "rotateY(0deg)" }],
      { duration: FLIP_MS, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" },
    );
    animation.onfinish = () => {
      setSpread(flip.to);
      setFlip(null);
    };
    return () => animation.cancel();
  }, [flip]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (viewer || (event.target as HTMLElement).closest("input, select, textarea")) return;
      if (event.key === "ArrowRight") go(current + 1);
      if (event.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function search(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const index = visible.findIndex((s) => s.kind === "card" && s.card.name.toLowerCase().includes(q));
    if (index === -1) return setNotFound(true);
    setNotFound(false);
    const found = visible[index] as Extract<AlbumSlot, { kind: "card" }>;
    setSpread(Math.floor(Math.floor(index / PER_PAGE) / perView));
    setHighlight(found.card.id);
    window.setTimeout(() => setHighlight(null), 2400);
  }

  // Doble página mientras gira la hoja: debajo se ve ya lo que queda al terminar.
  const shown = pagesOf(current);
  const target = flip ? pagesOf(flip.to) : shown;
  const left = perView === 1 ? (flip?.dir === -1 ? shown[0] : target[0]) : flip?.dir === -1 ? target[0] : shown[0];
  const right = perView === 2 ? (flip?.dir === 1 ? target[1] : shown[1]) : undefined;
  // Caras de la hoja que gira (sobre la página derecha al avanzar, sobre la izquierda al volver).
  const leafFront = perView === 1 ? (flip?.dir === 1 ? shown[0] : target[0]) : flip?.dir === 1 ? shown[1] : target[1];
  const leafBack = perView === 1 ? undefined : flip?.dir === 1 ? target[0] : shown[0];

  const pageLabel =
    perView === 2
      ? `Páginas ${current * 2 + 1}–${Math.min(current * 2 + 2, pages.length)} de ${pages.length}`
      : `Página ${current + 1} de ${pages.length}`;
  const open = (card: CollectionCardDto, from: DOMRect) => setViewer({ card, from });

  return (
    <div className="mt-6">
      {/* Barra del archivador. */}
      <div className="flex flex-col gap-3 border-2 border-ink bg-sheet p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Página anterior" className="flex min-h-11 min-w-11 items-center justify-center border-2 border-ink px-3 text-sm font-semibold text-ink transition-colors hover:bg-sheet-raised disabled:opacity-40">
            ‹<span className="ml-1 hidden sm:inline">Anterior</span>
          </button>
          <span className="flex-1 px-1 text-center text-sm font-semibold whitespace-nowrap text-ink tabular-nums sm:flex-none" aria-live="polite">
            {pageLabel}
          </span>
          <button type="button" onClick={() => go(current + 1)} disabled={current >= spreads - 1} aria-label="Página siguiente" className="flex min-h-11 min-w-11 items-center justify-center border-2 border-ink px-3 text-sm font-semibold text-ink transition-colors hover:bg-sheet-raised disabled:opacity-40">
            <span className="mr-1 hidden sm:inline">Siguiente</span>›
          </button>
          <select
            aria-label="Ir a una página"
            value={current}
            onChange={(e) => go(Number(e.target.value))}
            className="min-h-11 border-2 border-ink bg-sheet px-2 text-sm text-ink"
          >
            {Array.from({ length: spreads }, (_, s) => {
              const nums = pagesOf(s).flatMap((p) => p.slots.map((x) => (x.kind === "card" ? (x.card.number ?? 0) : x.number)));
              return (
                <option key={s} value={s}>
                  {nums.length ? `${pad(Math.min(...nums))}–${pad(Math.max(...nums))}` : "—"}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={search} role="search" className="flex min-w-0 flex-1 sm:flex-none">
            <input
              type="search"
              size={1}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNotFound(false);
              }}
              placeholder="Buscar…"
              aria-label="Buscar personaje en el álbum"
              className="min-h-11 min-w-0 flex-1 border-2 border-ink bg-sheet px-3 text-sm text-ink placeholder:text-ink-soft sm:w-44 sm:flex-none"
            />
            <button type="submit" className="min-h-11 border-2 border-l-0 border-ink bg-ink px-3 text-sm font-semibold text-paper">
              Buscar
            </button>
          </form>
          <button
            type="button"
            aria-pressed={onlyMine}
            onClick={() => {
              setOnlyMine((v) => !v);
              setSpread(0);
            }}
            className={`flex min-h-11 items-center border-2 border-ink px-3 text-sm font-semibold transition-colors ${
              onlyMine ? "bg-ink text-paper" : "bg-sheet text-ink hover:bg-sheet-raised"
            }`}
          >
            Solo los que tengo
          </button>
        </div>
      </div>
      {notFound && (
        <p role="status" className="mt-2 text-sm text-ink-soft">
          No hay ningún personaje descubierto con ese nombre en este álbum.
        </p>
      )}

      {/* El archivador: tapa de cartón, páginas y anillas. Se desliza para pasar página. */}
      <div
        className="relative mt-4 touch-pan-y border-2 border-ink bg-sheet-raised p-2 select-none sm:p-3"
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, moved: false };
          suppressClick.current = false;
        }}
        onPointerMove={(e) => {
          if (swipe.current && Math.abs(e.clientX - swipe.current.x) > 12) swipe.current.moved = true;
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start?.moved) return;
          suppressClick.current = true;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) > 60) go(current + (dx < 0 ? 1 : -1));
        }}
        onClickCapture={(e) => {
          // Un deslizamiento no abre la carta sobre la que empezó.
          if (suppressClick.current) {
            suppressClick.current = false;
            e.stopPropagation();
          }
        }}
      >
        <div className="flex [perspective:2200px]">
          <div className="relative min-w-0 flex-1">
            <BinderPage page={left} total={total} highlight={highlight} onOpen={open} />
            {perView === 1 && flip && leafFront && (
              <div ref={leaf} className="absolute inset-0 origin-left [backface-visibility:hidden] [transform-style:preserve-3d]">
                <BinderPage page={leafFront} total={total} highlight={null} onOpen={open} />
              </div>
            )}
          </div>
          {perView === 2 && <Rings />}
          {perView === 2 && (
            <div className="relative min-w-0 flex-1 [transform-style:preserve-3d]">
              <BinderPage page={right} total={total} highlight={highlight} onOpen={open} />
              {flip && (
                // La hoja gira sobre el lomo (borde izquierdo de la página derecha).
                <div
                  ref={leaf}
                  className="absolute inset-0 origin-[calc(-1.25rem)_50%] [transform-style:preserve-3d]"
                  style={{ transform: flip.dir === 1 ? "rotateY(0deg)" : "rotateY(-180deg)" }}
                >
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    <BinderPage page={leafFront} total={total} highlight={null} onOpen={open} />
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <BinderPage page={leafBack} total={total} highlight={null} onOpen={open} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Esquinas dobladas para pasar página con el ratón o el dedo (el teclado usa la barra). */}
        {current < spreads - 1 && (
          <button
            type="button"
            onClick={() => go(current + 1)}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-11 w-11 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-ink transition-transform hover:scale-110"
          />
        )}
        {current > 0 && (
          <button
            type="button"
            onClick={() => go(current - 1)}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-11 w-11 [clip-path:polygon(0_0,100%_100%,0_100%)] bg-ink transition-transform hover:scale-110"
          />
        )}
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Toca una carta para verla en grande, inclinarla y darle la vuelta. Pasa página con las esquinas, las flechas del
        teclado o deslizando.
      </p>

      {viewer && (
        <CardViewer
          card={viewer.card}
          total={total}
          from={viewer.from}
          onClosed={() => {
            const id = viewer.card.id;
            setViewer(null);
            // El foco vuelve a la carta en su funda (teclado y lectores de pantalla).
            requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-card="${id}"]`)?.focus());
          }}
        />
      )}
    </div>
  );
}
