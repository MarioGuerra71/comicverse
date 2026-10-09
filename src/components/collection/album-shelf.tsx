import Image from "next/image";
import Link from "next/link";
import type { AlbumDto } from "@/server/dto/character";

const pad = (n: number) => String(n).padStart(3, "0");

/**
 * Estantería de álbumes: cada serie es un archivador cerrado con la portada de su primer cómic,
 * el lomo de tinta con sus anillas, el progreso a mano y una barra. Al tocarlo se abre.
 */
export function AlbumShelf({ albums }: { albums: AlbumDto[] }) {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((album) => {
        const news = album.slots.filter((s) => s.kind === "card" && s.card.isNew).length;
        const percent = album.total ? Math.round((album.discovered / album.total) * 100) : 0;
        return (
          <li key={album.seriesId}>
            <Link
              href={`/collection/${album.seriesId}`}
              className="group block focus-visible:outline-offset-4"
              aria-label={`${album.title}: ${album.discovered} de ${album.total} personajes`}
            >
              {/* La tapa: se levanta un poco al pasar por encima, como al sacarla de la balda. */}
              <div className="relative aspect-4/5 border-2 border-ink bg-sheet-raised transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:-rotate-1">
                <div className="absolute inset-y-0 left-0 flex w-5 flex-col items-center justify-around border-r-2 border-ink bg-ink py-6">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full border-2 border-paper" />
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 left-5 overflow-hidden">
                  {album.coverThumbUrl ? (
                    <Image
                      src={album.coverThumbUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="300px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-ink-soft">Sin portada</span>
                  )}
                </div>
                {news > 0 && (
                  <span className="absolute -top-3 -right-2 rotate-3 border-2 border-ink bg-sheet px-2 font-hand text-lg leading-tight font-bold text-editor-ink">
                    ¡{news} {news === 1 ? "nuevo" : "nuevos"}!
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-tight font-bold text-ink">{album.title}</p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="font-hand text-2xl leading-none font-bold text-ink">
                  {pad(album.discovered)}
                  <span className="text-base font-medium text-ink-soft">/{pad(album.total)}</span>
                </span>
                <span className="text-xs text-ink-soft">{percent} %</span>
              </div>
              <div className="mt-1.5 h-1.5 bg-sheet-raised" aria-hidden="true">
                <div className="h-full bg-ink" style={{ width: `${percent}%` }} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
