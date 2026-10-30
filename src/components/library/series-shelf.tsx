import Image from "next/image";
import Link from "next/link";
import type { LibrarySeriesDto } from "@/server/dto/library";

// Las portadas de detrás asoman por arriba a la derecha, como un montón de grapas ordenado.
const STACK = ["z-30", "z-20 translate-x-1.5 -translate-y-1.5 opacity-70", "z-10 translate-x-3 -translate-y-3 opacity-40"];

/**
 * Carpetas de la biblioteca: una por serie, con sus últimas portadas apiladas y cuántos
 * cómics llevas leídos. Al tocarla se abre la rejilla con solo esa serie.
 */
export function SeriesShelf({ series, hrefFor }: { series: LibrarySeriesDto[]; hrefFor: (id: string) => string }) {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {series.map((s) => {
        const percent = s.total ? Math.round((s.read / s.total) * 100) : 0;
        const complete = s.total > 0 && s.read >= s.total;
        return (
          <li key={s.id}>
            <Link
              href={hrefFor(s.id)}
              className="group block focus-visible:outline-offset-4"
              aria-label={`${s.name}: ${s.read} de ${s.total} leídos`}
            >
              <div className="relative mt-3 mr-3 aspect-2/3">
                {(s.covers.length ? s.covers : [null]).map((cover, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 overflow-hidden rounded-lg bg-sheet-raised ring-1 ring-edge shadow-[0_12px_24px_-12px_rgb(0_0_0/0.9)] transition-transform duration-300 ease-out ${STACK[i]} ${
                      i === 0 ? "motion-safe:group-hover:-translate-y-1" : ""
                    }`}
                  >
                    {cover ? (
                      <Image src={cover} alt="" fill unoptimized sizes="240px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-ink-soft">Sin portada</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm leading-tight font-bold text-ink">
                {s.name}
                {s.startYear && <span className="font-normal text-ink-soft"> ({s.startYear})</span>}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-2 text-xs text-ink-soft">
                <span>
                  {s.read}/{s.total} leídos
                </span>
                {complete ? <span className="font-semibold text-editor-ink">Completa</span> : <span>{percent} %</span>}
              </div>
              <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-sheet-raised" aria-hidden="true">
                <div className={`h-full rounded-full ${complete ? "bg-editor" : "bg-ink-soft"}`} style={{ width: `${percent}%` }} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
