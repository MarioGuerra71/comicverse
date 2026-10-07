import Image from "next/image";
import Link from "next/link";
import type { ComicListItemDto } from "@/server/dto/comic";
import { pluralize } from "@/lib/format";

/** Cómic = viñeta entintada con su portada (el único color pleno) y su ficha debajo. */
export function ComicCard({
  comic,
  eager = false,
}: {
  comic: ComicListItemDto;
  eager?: boolean;
}) {
  const year = comic.releaseDate?.slice(0, 4);
  const characters =
    comic.characterCount > 0
      ? pluralize(comic.characterCount, "personaje", "personajes")
      : "Sin personajes";

  return (
    <Link href={`/comics/${comic.id}`} className="group flex flex-col">
      <div className="relative aspect-2/3 overflow-hidden border-2 border-ink bg-sheet">
        {comic.coverThumbUrl ? (
          <Image
            src={comic.coverThumbUrl}
            alt={`Portada de ${comic.title}`}
            fill
            unoptimized
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-ink-soft">
            Sin portada
          </div>
        )}
      </div>
      <p className="mt-2 text-sm leading-tight font-bold text-ink">{comic.title}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{[year, characters].filter(Boolean).join(" · ")}</p>
    </Link>
  );
}
