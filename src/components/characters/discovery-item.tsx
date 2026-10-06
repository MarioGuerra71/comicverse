import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { DiscoveryDto } from "@/server/services/dashboard";

/** Una línea del registro: "Venom · Con ASM #300 · 6 de octubre de 2026". */
export function DiscoveryItem({ discovery }: { discovery: DiscoveryDto }) {
  const { character, viaComic, discoveredAt } = discovery;
  return (
    <Link
      href={`/characters/${character.id}`}
      className="flex items-center gap-3 rounded-md border border-foreground/20 p-2 hover:bg-foreground/5"
    >
      <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-foreground/10">
        {character.imageThumbUrl && (
          <Image src={character.imageThumbUrl} alt="" fill unoptimized className="object-cover" />
        )}
      </span>
      <span className="text-sm">
        <span className="block font-medium">{character.name}</span>
        <span className="block opacity-60">
          {viaComic ? `Con ${viaComic.title}` : "Descubierto"} · {formatDate(discoveredAt.slice(0, 10))}
        </span>
      </span>
    </Link>
  );
}
