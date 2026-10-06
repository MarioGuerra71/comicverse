import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { READING_STATUS_LABELS } from "@/lib/reading-status";
import { ComicCard } from "@/components/comics/comic-card";
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
  const { stats, recentComics, recentDiscoveries } = await getDashboard(db, user.id);
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
          <h2 id="discoveries-heading" className="font-semibold">
            Últimos descubrimientos
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentDiscoveries.map(({ character, viaComic, discoveredAt }) => (
              <li key={character.id}>
                <Link
                  href={`/characters/${character.id}`}
                  className="flex items-center gap-3 rounded-md border border-foreground/20 p-2 hover:bg-foreground/5"
                >
                  <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-foreground/10">
                    {character.imageThumbUrl && (
                      <Image
                        src={character.imageThumbUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium">{character.name}</span>
                    <span className="block opacity-60">
                      {viaComic ? `Con ${viaComic.title}` : "Descubierto"} ·{" "}
                      {formatDate(discoveredAt.slice(0, 10))}
                    </span>
                  </span>
                </Link>
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
    </main>
  );
}
