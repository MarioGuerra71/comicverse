import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ZONES, type Zone } from "@/lib/zones";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { searchRemoteSeries } from "@/server/services/remote-catalog";
import { pluralize } from "@/lib/format";
import { SectionHeading } from "@/components/ui/page-parts";
import { ImportSeriesButton } from "@/components/catalog/import-series-button";

/** Series de Comic Vine que coinciden con la búsqueda (va en un Suspense: no frena el catálogo). */
export async function RemoteSeriesResults({ zone, query }: { zone: Zone; query: string }) {
  const client = getComicVineClient();
  if (!client) return null;

  let series;
  try {
    series = await searchRemoteSeries(db, client, zone, query);
  } catch {
    return (
      <p className="mt-10 text-sm text-ink-soft">
        Comic Vine no responde ahora mismo; prueba a buscar de nuevo en un momento.
      </p>
    );
  }

  return (
    <section aria-labelledby="remote-heading" className="mt-12">
      <SectionHeading id="remote-heading" title={`Más series de ${ZONES[zone].label} en Comic Vine`} />
      {series.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">No hay más series con ese nombre.</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <li key={s.externalId} className="flex gap-3 border-2 border-ink bg-sheet p-3">
              <div className="relative aspect-2/3 w-16 shrink-0 overflow-hidden border-2 border-ink bg-paper">
                {s.coverThumbUrl && (
                  <Image src={s.coverThumbUrl} alt="" fill unoptimized sizes="64px" className="object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div>
                  <p className="leading-tight font-bold text-ink">{s.name}</p>
                  <p className="text-xs text-ink-soft">
                    {[s.startYear, pluralize(s.issueCount, "cómic", "cómics")].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {s.seriesId ? (
                  <Link href={`/catalog?seriesId=${s.seriesId}`} className="text-sm text-ink underline">
                    Ya en el catálogo: ver cómics
                  </Link>
                ) : (
                  <ImportSeriesButton externalId={s.externalId} zone={zone} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
