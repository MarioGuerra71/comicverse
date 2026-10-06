import Image from "next/image";
import Link from "next/link";
import type { CollectionCardDto } from "@/server/dto/character";
import { pluralize } from "@/lib/format";

export const CARD_STATE_LABELS = {
  DISCOVERED: "Descubierto",
  COLLECTED: "Coleccionado",
} as const;

export function CharacterCard({ card }: { card: CollectionCardDto }) {
  return (
    <Link href={`/characters/${card.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-3/4 overflow-hidden rounded-md bg-foreground/10">
        {card.imageThumbUrl ? (
          <Image
            src={card.imageThumbUrl}
            alt={`Imagen de ${card.name}`}
            fill
            unoptimized
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs opacity-60">
            Sin imagen
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium ${
            card.state === "COLLECTED"
              ? "bg-foreground text-background"
              : "bg-background/80 text-foreground"
          }`}
        >
          {CARD_STATE_LABELS[card.state]}
        </span>
      </div>
      <div className="text-sm">
        <h2 className="font-medium leading-tight">
          {card.name}
          {card.isFavorite && (
            <span aria-label="Favorito" className="ml-1">
              ♥
            </span>
          )}
        </h2>
        {card.realName && <p className="opacity-60">{card.realName}</p>}
        <p className="opacity-60">
          {pluralize(card.comicsRead, "cómic leído", "cómics leídos")}
        </p>
      </div>
    </Link>
  );
}

/** Carta bloqueada: no recibe ningún dato del personaje (no existe en el navegador). */
export function LockedCard() {
  return (
    <div
      role="img"
      aria-label="Personaje por descubrir"
      className="flex aspect-3/4 items-center justify-center rounded-md border border-dashed border-foreground/20 bg-foreground/5 text-3xl font-bold opacity-50"
    >
      ?
    </div>
  );
}
