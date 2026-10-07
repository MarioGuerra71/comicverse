import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { describeActivity } from "@/lib/activity";
import { READING_STATUS_LABELS } from "@/lib/reading-status";
import { ComicCard } from "@/components/comics/comic-card";
import { DiscoveryItem } from "@/components/characters/discovery-item";
import {
  HeaderField,
  inkButton,
  PageHeader,
  SectionHeading,
} from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getDashboard } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "Inicio · ComicVerse" };

const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export default async function DashboardPage() {
  const user = await requireUser();
  const { stats, recentComics, recentDiscoveries, activity } = await getDashboard(db, user.id);
  const isNew = stats.library.total === 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title={`Hola, ${user.name}`}
        figure={`${percent(stats.characters.unlocked, stats.characters.total)}%`}
        figureLabel="del universo"
      >
        {/* Casillas del cajetín: cada cifra lleva a su pantalla. */}
        {/* Fondo de tinta con huecos de 2 px: los huecos dibujan los filetes entre casillas. */}
        <div className="grid grid-cols-2 gap-0.5 bg-ink sm:grid-cols-4">
          <HeaderField href="/library?status=READ" value={stats.library.READ} label="cómics leídos" />
          <HeaderField
            href="/collection"
            value={stats.characters.unlocked}
            total={stats.characters.total}
            label="personajes"
          />
          <HeaderField
            href="/graph"
            value={stats.relationships.discovered}
            total={stats.relationships.total}
            label="relaciones"
          />
          <HeaderField
            href="/catalog"
            value={stats.series.discovered}
            total={stats.series.total}
            label="series"
          />
        </div>
      </PageHeader>

      {isNew ? (
        <section className="mt-6 max-w-prose">
          <p className="text-ink">
            Tu universo está a lápiz. Añade cómics a tu biblioteca y márcalos como leídos: cada
            lectura entinta a los personajes que aparecen en ella.
          </p>
          <Link href="/catalog" className={`${inkButton} mt-4`}>
            Explorar el catálogo
          </Link>
        </section>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">
          En tu biblioteca: {stats.library.READING} leyendo · {stats.library.PENDING} pendientes ·{" "}
          {stats.library.DROPPED} abandonados.
        </p>
      )}

      {recentDiscoveries.length > 0 && (
        <section aria-labelledby="discoveries-heading" className="mt-10">
          <SectionHeading
            id="discoveries-heading"
            title="Últimos descubrimientos"
            href="/discoveries"
            linkLabel="Ver todos"
          />
          {/* Una tira de viñetas: en el móvil se desplaza en horizontal. */}
          <ul className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 scrollbar-none md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
            {recentDiscoveries.map((discovery) => (
              <li key={discovery.character.id} className="w-28 shrink-0 md:w-auto">
                <DiscoveryItem discovery={discovery} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentComics.length > 0 && (
        <section aria-labelledby="recent-heading" className="mt-10">
          <SectionHeading
            id="recent-heading"
            title="Últimos movimientos"
            href="/library"
            linkLabel="Ver biblioteca"
          />
          <ul className="mt-4 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {recentComics.map((item) => (
              <li key={item.comic.id} className="flex flex-col">
                <ComicCard comic={item.comic} />
                <p className="mt-1 font-hand text-lg leading-tight font-bold text-ink">
                  {READING_STATUS_LABELS[item.status].toLowerCase()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activity.length > 0 && (
        <section aria-labelledby="activity-heading" className="mt-10">
          <SectionHeading id="activity-heading" title="Actividad reciente" />
          <ol className="mt-2 text-sm">
            {activity.map((item, index) => (
              <li
                key={`${item.at}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line py-2"
              >
                <span className="text-ink">
                  {describeActivity(item.fromStatus, item.toStatus)}{" "}
                  <Link href={`/comics/${item.comic.id}`} className="font-semibold underline">
                    {item.comic.title}
                  </Link>
                </span>
                <span className="text-xs text-ink-soft">{formatDate(item.at.slice(0, 10))}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
