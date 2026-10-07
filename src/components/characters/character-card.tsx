import Image from "next/image";
import Link from "next/link";
import type { CollectionCardDto } from "@/server/dto/character";
import { pluralize } from "@/lib/format";
import { HeartIcon, StarMark } from "@/components/ui/icons";

export const CARD_STATE_LABELS = {
  DISCOVERED: "Descubierto",
  COLLECTED: "Coleccionado",
} as const;

const pad = (n: number) => String(n).padStart(3, "0");

/** Nº 014: número de catálogo con tres cifras, como en un álbum (texto plano, para aria). */
export const catalogLabel = (number: number | null) =>
  number === null ? "Nº —" : `Nº ${pad(number)}`;

/**
 * "Nº 014 / 032": "Nº" en la romana grabada y las cifras en Geist tabular, porque en
 * Marcellus a tamaño pequeño el 0 y el 1 se leen como O e I.
 */
function CatalogNumber({ number, total }: { number: number | null; total: number }) {
  return (
    <span className="text-sm text-star">
      <span className="font-display">Nº</span>{" "}
      <span className="tabular-nums">{number === null ? "—" : pad(number)}</span>
      <span className="text-dim tabular-nums"> / {pad(total)}</span>
    </span>
  );
}

/** Carta como lámina: imagen sin tintar, número de catálogo y, si se ha coleccionado, filete dorado. */
export function CharacterCard({ card, total }: { card: CollectionCardDto; total: number }) {
  const collected = card.state === "COLLECTED";
  return (
    <Link href={`/characters/${card.id}`} className="group flex flex-col">
      <div
        className={`relative aspect-3/4 overflow-hidden rounded-sm border bg-plate ${
          collected || card.isNew ? "border-gold" : "border-line"
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
          <div className="flex h-full items-center justify-center text-xs text-dim">
            Sin imagen
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <CatalogNumber number={card.number} total={total} />
        {card.isNew && <span className="font-medium text-gold">Nuevo</span>}
        {!card.isNew && collected && (
          <span className="text-gold" title={CARD_STATE_LABELS.COLLECTED}>
            <StarMark size={12} />
            <span className="sr-only">{CARD_STATE_LABELS.COLLECTED}</span>
          </span>
        )}
      </div>
      <h2 className="mt-0.5 flex items-start gap-1 text-sm font-medium leading-tight text-star">
        <span>{card.name}</span>
        {card.isFavorite && (
          <>
            <HeartIcon filled size={14} className="mt-0.5 shrink-0 text-star" />
            <span className="sr-only">(favorito)</span>
          </>
        )}
      </h2>
      {card.realName && <p className="mt-0.5 text-xs leading-snug text-dim">{card.realName}</p>}
      <p className="mt-0.5 text-xs text-dim">
        {pluralize(card.comicsRead, "cómic leído", "cómics leídos")}
      </p>
    </Link>
  );
}

/**
 * Hueco bloqueado: solo su número de catálogo; ni nombre, ni imagen, ni id. Se muestra
 * como ausencia (un hueco del álbum), sin texto extra: "por descubrir" va en aria-label.
 */
export function LockedCard({ number, total }: { number: number; total: number }) {
  return (
    <div className="flex flex-col" role="img" aria-label={`${catalogLabel(number)}: personaje por descubrir`}>
      <div className="flex aspect-3/4 items-center justify-center rounded-sm border border-line bg-plate/30 font-display text-3xl text-line-strong">
        ?
      </div>
      <div className="mt-2 opacity-70">
        <CatalogNumber number={number} total={total} />
      </div>
    </div>
  );
}
