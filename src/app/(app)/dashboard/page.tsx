import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { describeActivity } from "@/lib/activity";
import { READING_STATUS_LABELS } from "@/lib/reading-status";
import { ComicCard } from "@/components/comics/comic-card";
import { DiscoveryItem } from "@/components/characters/discovery-item";
import { requireUser } from "@/server/auth/session";
import { getDashboard } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "Inicio · ComicVerse" };

const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

function StatCard({
  label,
  value,
  total,
  href,
}: {
  label: string;
  value: number;
  total?: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-md border border-foreground/20 p-4 hover:bg-foreground/5"
    >
      <span className="text-sm opacity-70">{label}</span>
      <span className="text-2xl font-bold">
        {value}
        {total !== undefined && <span className="text-base font-normal opacity-60"> / {total}</span>}
      </span>
      {total !== undefined && (
        <progress
          value={value}
          max={total || 1}
          aria-label={`${label}: ${percent(value, total)}%`}
          className="h-1.5 w-full overflow-hidden rounded-full accent-foreground"
        />
      )}
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { stats, recentComics, recentDiscoveries, activity } = await getDashboard(db, user.id);
  const isNew = stats.library.total === 0;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Hola, {user.name}</h1>

      {isNew ? (
        <section className="mt-4 max-w-prose">
          <p className="opacity-80">
            Tu universo está por descubrir. Añade cómics a tu biblioteca y márcalos como
            leídos: cada lectura desbloquea a los personajes que aparecen en ella.
          </p>
          <Link
            href="/catalog"
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Explorar el catálogo
          </Link>
        </section>
      ) : (
        <p className="mt-1 opacity-70">
          Has descubierto el {percent(stats.characters.unlocked, stats.characters.total)}% de tu
          universo.
        </p>
      )}

      <section aria-labelledby="progress-heading" className="mt-6">
        <h2 id="progress-heading" className="sr-only">
          Progreso
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Cómics leídos" value={stats.library.READ} href="/library?status=READ" />
          <StatCard
            label="Personajes"
            value={stats.characters.unlocked}
            total={stats.characters.total}
            href="/collection"
          />
          <StatCard
            label="Relaciones"
            value={stats.relationships.discovered}
            total={stats.relationships.total}
            href="/graph"
          />
          <StatCard
            label="Series"
            value={stats.series.discovered}
            total={stats.series.total}
            href="/catalog"
          />
        </div>
        {!isNew && (
          <p className="mt-2 text-sm opacity-70">
            En tu biblioteca: {stats.library.READING} leyendo · {stats.library.PENDING} pendientes
            · {stats.library.DROPPED} abandonados.
          </p>
        )}
      </section>

      {recentDiscoveries.length > 0 && (
        <section aria-labelledby="discoveries-heading" className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 id="discoveries-heading" className="font-semibold">
              Últimos descubrimientos
            </h2>
            <Link href="/discoveries" className="text-sm underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentDiscoveries.map((discovery) => (
              <li key={discovery.character.id}>
                <DiscoveryItem discovery={discovery} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentComics.length > 0 && (
        <section aria-labelledby="recent-heading" className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-heading" className="font-semibold">
              Últimos movimientos en tu biblioteca
            </h2>
            <Link href="/library" className="text-sm underline">
              Ver biblioteca
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recentComics.map((item) => (
              <li key={item.comic.id} className="flex flex-col gap-1">
                <ComicCard comic={item.comic} />
                <p className="text-xs font-medium opacity-80">
                  {READING_STATUS_LABELS[item.status]}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activity.length > 0 && (
        <section aria-labelledby="activity-heading" className="mt-8">
          <h2 id="activity-heading" className="font-semibold">
            Actividad reciente
          </h2>
          <ol className="mt-3 flex flex-col gap-1 text-sm">
            {activity.map((item, index) => (
              <li key={`${item.at}-${index}`}>
                {describeActivity(item.fromStatus, item.toStatus)}{" "}
                <Link href={`/comics/${item.comic.id}`} className="underline">
                  {item.comic.title}
                </Link>
                <span className="opacity-60"> · {formatDate(item.at.slice(0, 10))}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
