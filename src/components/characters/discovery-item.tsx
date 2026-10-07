import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { DiscoveryDto } from "@/server/services/dashboard";

/** Un descubrimiento como viñeta de una tira: el personaje, el cómic que lo trajo y la fecha. */
export function DiscoveryItem({ discovery }: { discovery: DiscoveryDto }) {
  const { character, viaComic, discoveredAt } = discovery;
  return (
    <Link href={`/characters/${character.id}`} className="group flex flex-col">
      <span className="relative block aspect-3/4 overflow-hidden border-2 border-ink bg-sheet">
        {character.imageThumbUrl && (
          <Image
            src={character.imageThumbUrl}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        )}
      </span>
      <span className="mt-2 text-sm leading-tight font-bold text-ink">{character.name}</span>
      <span className="mt-0.5 text-xs leading-snug text-ink-soft">
        {viaComic ? `Con ${viaComic.title}` : "Descubierto"}
      </span>
      <span className="text-xs text-ink-soft">{formatDate(discoveredAt.slice(0, 10))}</span>
    </Link>
  );
}
