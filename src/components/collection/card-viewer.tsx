"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CollectionCardDto } from "@/server/dto/character";
import { pluralize } from "@/lib/format";

const pad = (n: number) => String(n).padStart(3, "0");
const OPEN_MS = 520;
const CLOSE_MS = 420;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Carta en grande. Sale volando de su funda (`from`) al centro, se inclina en 3D con un brillo
 * holográfico que sigue al puntero y se le puede dar la vuelta para ver la ficha. Al cerrar vuelve
 * a su funda. Con «reducir movimiento» solo aparece y desaparece.
 */
export function CardViewer({
  card,
  total,
  from,
  onClosed,
}: {
  card: CollectionCardDto;
  total: number;
  from: DOMRect;
  onClosed: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [flipped, setFlipped] = useState(false);
  const closing = useRef(false);

  // Transformación que lleva la carta grande a la caja de su funda (para el vuelo).
  const pocketTransform = useCallback(() => {
    const target = stage.current!.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (target.left + target.width / 2);
    const dy = from.top + from.height / 2 - (target.top + target.height / 2);
    const scale = from.width / target.width;
    return `translate(${dx}px, ${dy}px) scale(${scale}) rotate(-4deg)`;
  }, [from]);

  useEffect(() => {
    closeButton.current?.focus();
    if (reducedMotion()) return;
    stage.current!.animate(
      [{ transform: pocketTransform() }, { transform: "translate(0,0) scale(1.06) rotate(1deg)", offset: 0.7 }, { transform: "none" }],
      { duration: OPEN_MS, easing: EASE },
    );
    backdrop.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: OPEN_MS, easing: "ease-out" });
  }, [pocketTransform]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reducedMotion()) return onClosed();
    setFlipped(false);
    tilt.current?.style.setProperty("--rx", "0deg");
    tilt.current?.style.setProperty("--ry", "0deg");
    stage.current!.animate([{ transform: "none" }, { transform: pocketTransform() }], {
      duration: CLOSE_MS,
      easing: "cubic-bezier(0.5, 0, 0.75, 0)",
      fill: "forwards",
    });
    backdrop.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, fill: "forwards" }).onfinish =
      onClosed;
  }, [onClosed, pocketTransform]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Inclinación y brillo: variables CSS que siguen al puntero (ratón o dedo).
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion()) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    const style = event.currentTarget.style;
    style.setProperty("--rx", `${(x - 0.5) * 22}deg`);
    style.setProperty("--ry", `${(0.5 - y) * 22}deg`);
    style.setProperty("--mx", `${x * 100}%`);
    style.setProperty("--my", `${y * 100}%`);
  }
  function onPointerLeave(event: React.PointerEvent<HTMLDivElement>) {
    const style = event.currentTarget.style;
    style.setProperty("--rx", "0deg");
    style.setProperty("--ry", "0deg");
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={card.name} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div ref={backdrop} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={close} />
      <button
        ref={closeButton}
        type="button"
        onClick={close}
        aria-label="Cerrar"
        className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center border-2 border-paper text-paper transition-colors hover:bg-paper hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative flex flex-col items-center gap-4">
        <div ref={stage} className="[perspective:1100px]">
          <div
            ref={tilt}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onClick={() => setFlipped((f) => !f)}
            style={{ "--rx": "0deg", "--ry": "0deg", "--mx": "50%", "--my": "50%" } as React.CSSProperties}
            className="relative aspect-3/4 h-[min(64vh,520px,calc((100vw-2rem)*4/3))] cursor-pointer transition-transform duration-150 ease-out [transform:rotateY(var(--rx))_rotateX(var(--ry))] [transform-style:preserve-3d]"
          >
            <div
              className={`absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* Anverso: la imagen a todo color con el brillo holográfico encima. */}
              <div className="absolute inset-0 flex flex-col overflow-hidden border-[3px] border-ink bg-sheet [backface-visibility:hidden]">
                <div className="relative flex-1 overflow-hidden">
                  {card.imageThumbUrl ? (
                    <Image src={card.imageThumbUrl} alt={`Imagen de ${card.name}`} fill unoptimized sizes="400px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm text-ink-soft">Sin imagen</span>
                  )}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-55 mix-blend-color-dodge [background:linear-gradient(115deg,transparent_25%,rgb(255_255_255/0.55)_42%,rgb(255_70_170/0.35)_48%,rgb(80_200_255/0.35)_54%,rgb(255_230_90/0.3)_60%,transparent_75%)] [background-position:var(--mx)_var(--my)] [background-size:250%_250%]"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 mix-blend-overlay [background:radial-gradient(circle_at_var(--mx)_var(--my),rgb(255_255_255/0.7),transparent_50%)]"
                  />
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t-[3px] border-ink bg-sheet px-3 py-2">
                  <span className="truncate text-lg leading-tight font-extrabold text-ink">{card.name}</span>
                  <span className="shrink-0 font-hand text-2xl leading-none font-bold text-ink">
                    {card.number !== null ? pad(card.number) : "—"}
                    <span className="text-base font-medium text-ink-soft">/{pad(total)}</span>
                  </span>
                </div>
              </div>

              {/* Reverso: la ficha del personaje, en papel y tinta. */}
              <div className="absolute inset-0 flex flex-col border-[3px] border-ink bg-sheet p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                {card.imageThumbUrl && (
                  <span className="absolute top-5 right-5 block aspect-3/4 w-20 overflow-hidden border-2 border-ink">
                    <Image src={card.imageThumbUrl} alt="" fill unoptimized sizes="80px" className="object-cover" />
                  </span>
                )}
                <p className="font-hand text-3xl leading-none font-bold text-ink">
                  {card.number !== null ? pad(card.number) : "—"}
                  <span className="text-xl text-ink-soft">/{pad(total)}</span>
                </p>
                <h2 className="mt-3 pr-24 text-2xl leading-tight font-extrabold tracking-tight text-ink">{card.name}</h2>
                {card.realName && <p className="mt-1 pr-24 text-sm text-ink-soft">{card.realName}</p>}
                <p className="mt-2 font-hand text-xl font-bold text-editor-ink">
                  {card.isNew ? "¡nuevo!" : card.state === "COLLECTED" ? "coleccionado" : "descubierto"}
                </p>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y-2 border-ink py-3 text-sm">
                  <dt className="text-ink-soft">Cómics leídos</dt>
                  <dd className="text-ink">{pluralize(card.comicsRead, "cómic", "cómics")}</dd>
                  <dt className="text-ink-soft">Favorito</dt>
                  <dd className="text-ink">{card.isFavorite ? "Sí" : "No"}</dd>
                </dl>
                <div className="mt-auto flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/characters/${card.id}`} className="inline-flex min-h-11 items-center text-sm text-ink underline">
                    Ver su ficha completa
                  </Link>
                  <Link href={`/graph?focus=${card.id}`} className="inline-flex min-h-11 items-center text-sm text-ink underline">
                    Ver su reparto en el universo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="min-h-11 border-2 border-paper px-4 text-sm font-semibold text-paper transition-colors hover:bg-paper hover:text-ink"
        >
          {flipped ? "Ver la carta" : "Dar la vuelta"}
        </button>
      </div>
    </div>
  );
}
