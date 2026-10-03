import Image from "next/image";
import Link from "next/link";
import type { ComicListItemDto } from "@/server/dto/comic";
import { pluralize } from "@/lib/format";

export function ComicCard({ comic }: { comic: ComicListItemDto }) {
  const year = comic.releaseDate?.slice(0, 4);
  const characters =
    comic.characterCount > 0
      ? pluralize(comic.characterCount, "personaje", "personajes")
      : "Sin personajes";

  return (
    <Link href={`/comics/${comic.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-2/3 overflow-hidden rounded-md bg-foreground/10">
        {comic.coverThumbUrl ? (
          <Image
            src={comic.coverThumbUrl}
            alt={`Portada de ${comic.title}`}
            fill
            unoptimized
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs opacity-60">
            Sin portada
          </div>
        )}
      </div>
      <div className="text-sm">
        <p className="font-medium leading-tight">{comic.title}</p>
        <p className="opacity-60">{[year, characters].filter(Boolean).join(" · ")}</p>
      </div>
    </Link>
  );
}