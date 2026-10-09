import Image from "next/image";
import Link from "next/link";
import type { CollectionCardDto } from "@/server/dto/character";
import { pluralize } from "@/lib/format";
import { HeartIcon } from "@/components/ui/icons";

export const CARD_STATE_LABELS = {
  DISCOVERED: "Descubierto",
  COLLECTED: "Coleccionado",
} as const;

const pad = (n: number) => String(n).padStart(3, "0");

/** Nº 014: número de catálogo con tres cifras (texto plano, para aria). */
export const catalogLabel = (number: number | null) =>
  number === null ? "Nº —" : `Nº ${pad(number)}`;

/** Número de catálogo escrito a mano encima de la viñeta, como el número de página del dibujante. */
function HandNumber({ number, total, className }: { number: number | null; total: number; className: string }) {
  return (
    <span className={`font-hand text-2xl leading-none font-bold ${className}`}>
      {number === null ? (
        // Sin número de catálogo (personajes de series añadidas): hueco vacío, la rejilla no se mueve.
        <span className="invisible">000</span>
      ) : (
        <>
          {pad(number)}
          {/* Menos peso por tamaño, no por transparencia: en azul la opacidad bajaba el contraste. */}
          <span className="text-base font-medium">/{pad(total)}</span>
        </>
      )}
    </span>
  );
}

/**
 * Carta = viñeta entintada: la imagen es lo único a todo color. El lápiz del editor
 * (color de la editorial) marca lo nuevo con un recuadro y una nota, y lo coleccionado
 * con una nota al margen.
 */
export function CharacterCard({ card, total }: { card: CollectionCardDto; total: number }) {
  const collected = card.state === "COLLECTED";
  return (
    <Link href={`/characters/${card.id}`} className="group flex flex-col">
      <HandNumber number={card.number} total={total} className="text-ink" />
      <div
        className={`relative mt-1.5 aspect-3/4 overflow-hidden border-2 border-ink bg-sheet ${
          card.isNew ? "outline-2 outline-offset-4 outline-editor" : ""
        }`}
      >
        {card.imageThumbUrl ? (
          <Image
            src={card.imageThumbUrl}
            alt={`Imagen de ${card.name}`}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-soft">Sin imagen</div>
        )}
      </div>
      <h2 className="mt-2 flex items-start gap-1 text-sm leading-tight font-bold text-ink">
        <span>{card.name}</span>
        {card.isFavorite && (
          <>
            <HeartIcon filled size={14} className="mt-0.5 shrink-0 text-ink" />
            <span className="sr-only">(favorito)</span>
          </>
        )}
      </h2>
      {/* Nota del editor al margen (debajo: en columnas estrechas no cabe junto al número). */}
      {card.isNew ? (
        <p className="font-hand text-xl leading-tight font-bold text-editor-ink">¡nuevo!</p>
      ) : (
        collected && <p className="font-hand text-lg leading-tight font-bold text-editor-ink">coleccionado</p>
      )}
      {card.realName && <p className="mt-0.5 text-xs leading-snug text-ink-soft">{card.realName}</p>}
      <p className="mt-0.5 text-xs text-ink-soft">
        {pluralize(card.comicsRead, "cómic leído", "cómics leídos")}
      </p>
    </Link>
  );
}

/**
 * Hueco bloqueado = viñeta aún por dibujar: solo lápiz azul, con el aspa que los
 * dibujantes ponen en una viñeta vacía. Solo su número; ni nombre, ni imagen, ni id.
 */
export function LockedCard({ number, total }: { number: number; total: number }) {
  return (
    <div className="flex flex-col" role="img" aria-label={`${catalogLabel(number)}: personaje por descubrir`}>
      <HandNumber number={number} total={total} className="text-blue-ink" />
      <div className="relative mt-1.5 aspect-3/4 border-[1.5px] border-blue">
        <svg viewBox="0 0 30 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M0 0 L30 40 M30 0 L0 40" stroke="var(--blue)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}
