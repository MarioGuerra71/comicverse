import { getZone } from "@/server/zone";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { describeActivity } from "@/lib/activity";
import { DiscoveryItem } from "@/components/characters/discovery-item";
import { HeaderField, inkButton, SectionHeading } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getDashboard } from "@/server/services/dashboard";
import { ArrowIcon } from "@/components/ui/icons";
import { MarkReadButton } from "@/components/library/mark-read-button";
import { QuickRating } from "@/components/library/quick-rating";

export const metadata: Metadata = { title: "Inicio · ComicVerse" };

const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export default async function DashboardPage() {
  const user = await requireUser();
  const zone = await getZone();
  const { stats, recentComics, hero, heroSeries, heroNext, recentDiscoveries, activity, nextIssues, newIssues, week } =
    await getDashboard(db, user.id, zone);
  const seriesPercent = heroSeries ? percent(heroSeries.read, heroSeries.total) : 0;
  const longbox = recentComics.filter((item) => item !== hero);
  // El siguiente número va dentro de la caja (si no es el mismo que ya estás leyendo).
  const next = heroNext && heroNext.comic.id !== hero?.comic.id ? heroNext : null;
  const weekMax = Math.max(1, ...week.days.map((d) => d.count));
  const weekTotal = week.days.reduce((sum, d) => sum + d.count, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <h1
        id="hello-heading"
        className="font-display text-3xl leading-none font-extrabold tracking-tight break-words text-ink uppercase sm:text-4xl"
      >
        Hola, {user.name}
      </h1>

      {/* La caja de luz: una banda de cristal iluminada por detrás con la portada que tienes entre manos. */}
      <section
        aria-label="Tu lectura y tu universo"
        className="glass relative mt-5 overflow-hidden rounded-3xl ring-1 ring-edge"
      >
        {hero?.comic.coverThumbUrl && (
          <Image
            src={hero.comic.coverThumbUrl}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            className="scale-125 object-cover opacity-35 blur-3xl saturate-150"
          />
        )}
        <div className="relative grid items-center gap-8 p-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:p-10">
          {hero ? (
            <Link
              href={`/comics/${hero.comic.id}`}
              className="lightbox-item group mx-auto block w-48 rounded-lg sm:w-56 md:w-60"
              aria-label={`${hero.status === "READING" ? "Seguir con" : "Abrir"} ${hero.comic.title}`}
            >
              <span className="lightbox-cover relative block aspect-2/3 overflow-hidden rounded-lg ring-1 ring-white/25">
                {hero.comic.coverThumbUrl ? (
                  <Image
                    src={hero.comic.coverThumbUrl}
                    alt=""
                    fill
                    unoptimized
                    priority
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center bg-sheet text-sm text-ink-soft">
                    Sin portada
                  </span>
                )}
              </span>
            </Link>
          ) : (
            <span aria-hidden="true" className="hidden md:block" />
          )}

          <div className="min-w-0 text-center md:text-left">
            {hero ? (
              <>
                <p className="text-xs tracking-wide text-ink-soft uppercase">
                  {hero.status === "READING" ? "Leyendo" : "Último leído"}
                </p>
                <p className="mt-2 font-display text-3xl leading-[0.95] font-extrabold tracking-tight text-balance text-ink uppercase md:text-4xl">
                  {hero.comic.title}
                </p>
                {hero.comic.storyTitle && <p className="mt-1 text-sm text-ink-soft">{hero.comic.storyTitle}</p>}
                {/* Puntuar ahí mismo: solo se puede con el cómic leído. */}
                {hero.status === "READ" && (
                  <div className="mt-3">
                    <QuickRating comicId={hero.comic.id} rating={hero.rating} />
                  </div>
                )}
                <Link href={`/comics/${hero.comic.id}`} className={`${inkButton} mt-4`}>
                  {hero.status === "READING" ? "Seguir" : "Abrir"}
                  <ArrowIcon size={16} />
                </Link>
              </>
            ) : (
              <>
                <p className="max-w-prose text-ink">
                  Tu tienda aún tiene las luces apagadas. Añade cómics a tu biblioteca y márcalos como leídos:
                  cada lectura enciende a los personajes que aparecen en ella.
                </p>
                <Link href="/catalog" className={`${inkButton} mt-5`}>
                  Explorar el catálogo
                </Link>
              </>
            )}
          </div>

          {/* El siguiente número de la serie, listo para marcar. */}
          {next ? (
            <div className="mx-auto flex w-full max-w-xs items-center gap-4 rounded-2xl bg-black/25 p-3 ring-1 ring-white/10 md:w-64">
              <Link
                href={`/comics/${next.comic.id}`}
                className="relative block aspect-2/3 w-16 shrink-0 overflow-hidden rounded-md bg-sheet ring-1 ring-edge"
              >
                {next.comic.coverThumbUrl && (
                  <Image src={next.comic.coverThumbUrl} alt="" fill unoptimized sizes="64px" className="object-cover" />
                )}
              </Link>
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-ink-soft uppercase">Siguiente</p>
                <Link
                  href={`/comics/${next.comic.id}`}
                  className="mt-0.5 block text-sm leading-tight font-bold text-ink hover:underline"
                >
                  {next.comic.title}
                </Link>
                <MarkReadButton comicId={next.comic.id} title={next.comic.title} />
              </div>
            </div>
          ) : (
            hero && <span aria-hidden="true" className="hidden md:block" />
          )}

          {/* La tira de la serie: un trazo por número, encendidos los leídos y destacado el actual. */}
          {heroSeries && (
            <div className="md:col-span-3">
              <div aria-hidden="true" className="flex h-7 items-end gap-[3px]">
                {heroSeries.strip.items.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/comics/${issue.id}`}
                    tabIndex={-1}
                    title={`${issue.title}${issue.read ? " · leído" : ""}`}
                    className={`flex-1 rounded-sm transition-[height,background-color] hover:h-full ${
                      issue.current
                        ? "h-full bg-editor shadow-[0_0_10px_var(--glow)]"
                        : issue.read
                          ? "h-4 bg-editor/60 hover:bg-editor"
                          : "h-4 bg-white/15 hover:bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-ink-soft">
                <span>
                  <span className="font-semibold text-ink">{heroSeries.name}</span> ·{" "}
                  <span className="tabular-nums">
                    {heroSeries.read}/{heroSeries.total} leídos ({seriesPercent} %)
                  </span>
                </span>
                {heroSeries.total > heroSeries.strip.items.length && (
                  <span className="tabular-nums">
                    números {heroSeries.strip.start + 1}–{heroSeries.strip.start + heroSeries.strip.items.length} de{" "}
                    {heroSeries.total}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Tu semana: de lunes a domingo, sin tener que ir a Estadísticas. */}
      {stats.library.total > 0 && (
        <section
          aria-labelledby="week-heading"
          className="glass mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl px-5 py-4 ring-1 ring-edge"
        >
          <h2 id="week-heading" className="text-xs tracking-wide text-ink-soft uppercase">
            Tu semana
          </h2>
          <ol className="flex flex-1 items-end gap-2 sm:max-w-xs">
            {week.days.map((day, i) => (
              <li key={day.key} className="flex flex-1 flex-col items-center gap-1">
                <span aria-hidden="true" className={`text-[11px] tabular-nums ${day.count ? "text-ink" : "text-transparent"}`}>
                  {day.count}
                </span>
                <span aria-hidden="true" className="flex h-8 w-full items-end justify-center">
                  <span
                    className={`w-full max-w-5 rounded-sm ${
                      day.future ? "bg-white/5" : day.count ? (day.today ? "bg-editor" : "bg-editor/60") : "bg-line-strong"
                    }`}
                    style={{ height: day.count ? `${Math.max(20, (day.count / weekMax) * 100)}%` : "2px" }}
                  />
                </span>
                <span className={`text-[11px] ${day.today ? "font-bold text-ink" : "text-ink-soft"}`}>
                  <span aria-hidden="true">{WEEKDAYS[i]}</span>
                  <span className="sr-only">{`${day.today ? "Hoy" : day.key}: ${day.count}`}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink tabular-nums">{weekTotal}</span> esta semana ·{" "}
            <span className="font-semibold text-ink tabular-nums">{week.thisMonth}</span> este mes · racha de{" "}
            <span className="font-semibold text-ink tabular-nums">{week.streak}</span>{" "}
            {week.streak === 1 ? "semana" : "semanas"}
          </p>
          <Link href="/stats" className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            Estadísticas
          </Link>
        </section>
      )}

      {/* Casillas de cristal: cada cifra lleva a su pantalla. */}
      <div className="glass mt-6 grid grid-cols-2 overflow-hidden rounded-2xl ring-1 ring-edge sm:grid-cols-4">
        <HeaderField href="/library?status=READ" value={stats.library.READ} label="cómics leídos" />
        <HeaderField href="/collection" value={stats.characters.unlocked} total={stats.characters.total} label="personajes" />
        <HeaderField href="/graph" value={stats.relationships.discovered} total={stats.relationships.total} label="relaciones" />
        <HeaderField href="/catalog" value={stats.series.discovered} total={stats.series.total} label="series" />
      </div>

      {longbox.length > 0 && (
        <section aria-labelledby="recent-heading" className="mt-12">
          <SectionHeading id="recent-heading" title="Tu longbox" href="/library?status=READ" linkLabel="Ver biblioteca" />
          {/* El longbox: hojea las portadas; se levantan al pasar o enfocar. */}
          <ul className="longbox -mx-4 mt-4 flex gap-5 overflow-x-auto px-4 pt-6 pb-4 scrollbar-none md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-5">
            {longbox.map((item) => (
              <li key={item.comic.id} className="w-32 shrink-0 md:w-auto">
                <Link href={`/comics/${item.comic.id}`} className="longbox-item block rounded-lg">
                  <span className="longbox-cover relative block aspect-2/3 overflow-hidden rounded-lg bg-sheet ring-1 ring-edge">
                    {item.comic.coverThumbUrl ? (
                      <Image
                        src={item.comic.coverThumbUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="200px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center p-2 text-center text-xs text-ink-soft">
                        Sin portada
                      </span>
                    )}
                  </span>
                  <span className="mt-3 block text-sm leading-tight font-bold text-ink">{item.comic.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* El siguiente número de cada serie que llevas a medias, listo para marcar. */}
      {nextIssues.length > 0 && (
        <section aria-labelledby="next-heading" className="mt-12">
          <SectionHeading id="next-heading" title="Qué leer ahora" />
          <ul className="-mx-4 mt-4 flex gap-5 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
            {nextIssues.map((item) => (
              <li key={item.comic.id} className="w-32 shrink-0 md:w-auto">
                <Link href={`/comics/${item.comic.id}`} className="block rounded-lg">
                  <span className="relative block aspect-2/3 overflow-hidden rounded-lg bg-sheet ring-1 ring-edge">
                    {item.comic.coverThumbUrl ? (
                      <Image src={item.comic.coverThumbUrl} alt="" fill unoptimized sizes="200px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center p-2 text-center text-xs text-ink-soft">
                        Sin portada
                      </span>
                    )}
                  </span>
                  <span className="mt-3 block text-sm leading-tight font-bold text-ink">{item.comic.title}</span>
                </Link>
                <span className="mt-1 block text-xs text-ink-soft tabular-nums">
                  {item.read}/{item.total} de la serie
                </span>
                <MarkReadButton comicId={item.comic.id} title={item.comic.title} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Números salidos este último mes de las series que sigues y que aún no tienes. */}
      {newIssues.length > 0 && (
        <section aria-labelledby="new-heading" className="mt-12">
          <SectionHeading id="new-heading" title="Novedades de tus series" />
          <ul className="mt-2 text-sm">
            {newIssues.map((group) => (
              <li key={group.series.id} className="flex items-center gap-3 border-b border-line py-3">
                <span className="relative block h-14 w-10 shrink-0 overflow-hidden rounded bg-sheet ring-1 ring-edge">
                  {group.latest.coverThumbUrl && (
                    <Image src={group.latest.coverThumbUrl} alt="" fill unoptimized sizes="40px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-ink">
                  <span className="font-semibold">{group.series.name}</span>
                  <span className="block text-xs text-ink-soft">
                    {group.count === 1 ? "1 número nuevo" : `${group.count} números nuevos`} · último:{" "}
                    {group.latest.title}
                  </span>
                </span>
                <Link
                  href={`/comics/${group.latest.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                >
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentDiscoveries.length > 0 && (
        <section aria-labelledby="discoveries-heading" className="mt-12">
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

      {activity.length > 0 && (
        <section aria-labelledby="activity-heading" className="mt-12">
          <SectionHeading id="activity-heading" title="Actividad reciente" />
          <ol className="mt-2 text-sm">
            {activity.map((item, index) => (
              <li
                key={`${item.at}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line py-3"
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
