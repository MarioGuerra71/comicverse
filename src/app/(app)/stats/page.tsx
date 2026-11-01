import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { db } from "@/lib/db";
import { ZONES } from "@/lib/zones";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { PageHeader, SectionHeading, segment, segmentGroup } from "@/components/ui/page-parts";
import type { TimelineView } from "@/server/domain/reading-stats";
import { requireUser } from "@/server/auth/session";
import { getReadingStats } from "@/server/services/dashboard";
import { getZone } from "@/server/zone";

export const metadata: Metadata = { title: "Estadísticas · ComicVerse" };

// La vista va en la URL en español (?vista=semana); por defecto, por día.
const VIEWS = [
  { value: "dia", view: "day", label: "Día", title: "Lecturas por día", hint: "últimos 30 días" },
  { value: "semana", view: "week", label: "Semana", title: "Lecturas por semana", hint: "últimas 12 semanas" },
  { value: "mes", view: "month", label: "Mes", title: "Lecturas por mes", hint: "últimos 12 meses" },
] as const satisfies readonly { value: string; view: TimelineView; label: string; title: string; hint: string }[];

const statsSearchSchema = z.object({ vista: z.enum(["dia", "semana", "mes"]).default("dia") });

const fmt = (key: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", ...options }).format(new Date(`${key.length === 7 ? `${key}-01` : key}T00:00:00Z`));

/** Texto bajo cada barra (corto) y el de la tabla y la ayuda al pasar por encima (largo). */
function labels(view: TimelineView, key: string, index: number, total: number) {
  if (view === "day") {
    const short = index === total - 1 ? "hoy" : index % 5 === 4 ? fmt(key, { day: "numeric" }) : "";
    return { short, long: fmt(key, { weekday: "long", day: "numeric", month: "long" }) };
  }
  if (view === "week") {
    const short = index % 2 === 1 || index === total - 1 ? fmt(key, { day: "numeric", month: "short" }).replace(".", "") : "";
    return { short, long: `Semana del ${fmt(key, { day: "numeric", month: "long" })}` };
  }
  return { short: fmt(key, { month: "short" }).replace(".", ""), long: fmt(key, { month: "long", year: "numeric" }) };
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col px-4 py-3">
      <span className="font-display text-4xl leading-none font-extrabold text-ink tabular-nums">{value}</span>
      <span className="mt-1 text-xs tracking-wide text-ink-soft uppercase">{label}</span>
    </div>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const zone = await getZone();
  const parsed = statsSearchSchema.safeParse(normalizeParams(await searchParams));
  const active = VIEWS.find((v) => v.value === (parsed.success ? parsed.data.vista : "dia"))!;
  const stats = await getReadingStats(db, user.id, zone, active.view);
  const max = Math.max(1, ...stats.timeline.map((p) => p.count));
  const inRange = stats.timeline.reduce((sum, p) => sum + p.count, 0);
  const current = stats.timeline.at(-1)?.count ?? 0;
  const maxCharacter = stats.topCharacters[0]?.comicsRead ?? 1;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title={`Estadísticas ${ZONES[zone].label}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <Figure value={stats.read} label="cómics leídos" />
          <Figure value={stats.lastYear} label="últimos 12 meses" />
          <Figure value={stats.streak} label={stats.streak === 1 ? "semana seguida" : "semanas seguidas"} />
          <Figure value={stats.completedSeries} label="series completas" />
        </div>
      </PageHeader>

      {stats.read === 0 ? (
        <p className="mt-10 text-ink">
          Aún no has leído ningún cómic.{" "}
          <Link href="/catalog" className="underline">
            Explora el catálogo
          </Link>{" "}
          y marca los que leas para ver aquí tus cifras.
        </p>
      ) : (
        <>
          <section aria-labelledby="timeline-heading" className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionHeading id="timeline-heading" title={active.title} />
              <nav aria-label="Ver lecturas por" className={segmentGroup}>
                {VIEWS.map((v) => (
                  <Link
                    key={v.value}
                    href={v.value === "dia" ? "/stats" : `/stats?vista=${v.value}`}
                    aria-current={v === active ? "page" : undefined}
                    className={segment(v === active)}
                    scroll={false}
                  >
                    {v.label}
                  </Link>
                ))}
              </nav>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {inRange} en los {active.hint} ·{" "}
              {active.view === "day" ? "hoy" : active.view === "week" ? "esta semana" : "este mes"}: {current}
            </p>
            {/* Una barra por periodo (el actual, encendido); la cifra sale al pasar por encima y en la tabla. */}
            <div
              aria-hidden="true"
              className={`mt-8 flex h-40 items-end border-b border-line ${active.view === "day" ? "gap-0.5 sm:gap-1" : "gap-1.5 sm:gap-3"}`}
            >
              {stats.timeline.map((p, i) => {
                const last = i === stats.timeline.length - 1;
                return (
                  <div key={p.key} className="group relative flex h-full flex-1 items-end justify-center">
                    <span className="pointer-events-none absolute -top-6 text-xs font-semibold text-ink opacity-0 tabular-nums group-hover:opacity-100">
                      {p.count}
                    </span>
                    <div
                      title={`${labels(active.view, p.key, i, stats.timeline.length).long}: ${p.count}`}
                      className={`w-full max-w-8 rounded-t ${
                        p.count ? (last ? "bg-editor" : "bg-editor/60 group-hover:bg-editor") : "bg-line-strong"
                      }`}
                      style={{ height: p.count ? `${(p.count / max) * 100}%` : "2px" }}
                    />
                  </div>
                );
              })}
            </div>
            <div aria-hidden="true" className={`mt-2 flex text-center text-[11px] text-ink-soft ${active.view === "day" ? "gap-0.5 sm:gap-1" : "gap-1.5 sm:gap-3"}`}>
              {stats.timeline.map((p, i) => (
                <span key={p.key} className="flex-1 whitespace-nowrap capitalize">
                  {labels(active.view, p.key, i, stats.timeline.length).short}
                </span>
              ))}
            </div>
            <table className="sr-only">
              <caption>{`${active.title} (${active.hint})`}</caption>
              <tbody>
                {stats.timeline.map((p, i) => (
                  <tr key={p.key}>
                    <th scope="row">{labels(active.view, p.key, i, stats.timeline.length).long}</th>
                    <td>{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="characters-heading" className="mt-12">
            <SectionHeading id="characters-heading" title="Personajes más leídos" href="/collection?sort=comics" linkLabel="Ver colección" />
            <ol className="mt-4 flex flex-col gap-3">
              {stats.topCharacters.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/characters/${c.id}`} className="group flex items-center gap-3">
                    <span className="w-6 text-right font-display text-xl font-extrabold text-ink-soft tabular-nums">
                      {i + 1}
                    </span>
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sheet ring-1 ring-edge">
                      {c.imageThumbUrl && (
                        <Image src={c.imageThumbUrl} alt="" fill unoptimized sizes="40px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate font-semibold text-ink group-hover:underline">{c.name}</span>
                        <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                          {c.comicsRead} {c.comicsRead === 1 ? "cómic" : "cómics"}
                        </span>
                      </span>
                      <span aria-hidden="true" className="mt-1.5 block h-1 overflow-hidden rounded-full bg-sheet-raised">
                        <span
                          className="block h-full rounded-full bg-ink-soft"
                          style={{ width: `${(c.comicsRead / maxCharacter) * 100}%` }}
                        />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </main>
  );
}
