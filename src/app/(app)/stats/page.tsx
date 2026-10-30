import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ZONES } from "@/lib/zones";
import { PageHeader, SectionHeading } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getReadingStats } from "@/server/services/dashboard";
import { getZone } from "@/server/zone";

export const metadata: Metadata = { title: "Estadísticas · ComicVerse" };

const monthLabel = (month: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("es-ES", { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col px-4 py-3">
      <span className="font-display text-4xl leading-none font-extrabold text-ink tabular-nums">{value}</span>
      <span className="mt-1 text-xs tracking-wide text-ink-soft uppercase">{label}</span>
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const zone = await getZone();
  const stats = await getReadingStats(db, user.id, zone);
  const maxMonth = Math.max(1, ...stats.months.map((m) => m.count));
  const thisYear = stats.months.reduce((sum, m) => sum + m.count, 0);
  const maxCharacter = stats.topCharacters[0]?.comicsRead ?? 1;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title={`Estadísticas ${ZONES[zone].label}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <Figure value={stats.read} label="cómics leídos" />
          <Figure value={thisYear} label="últimos 12 meses" />
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
          <section aria-labelledby="months-heading" className="mt-12">
            <SectionHeading id="months-heading" title="Lecturas por mes" />
            {/* Una barra por mes; la cifra sale al pasar por encima y en la tabla para lectores de pantalla. */}
            <div aria-hidden="true" className="mt-6 flex h-40 items-end gap-1.5 border-b border-line sm:gap-3">
              {stats.months.map((m) => (
                <div key={m.month} className="group relative flex h-full flex-1 items-end justify-center">
                  <span className="pointer-events-none absolute -top-6 text-xs font-semibold text-ink opacity-0 tabular-nums group-hover:opacity-100">
                    {m.count}
                  </span>
                  <div
                    title={`${monthLabel(m.month, "long")}: ${m.count}`}
                    className={`w-full max-w-8 rounded-t ${m.count ? "bg-editor/80 group-hover:bg-editor" : "bg-line-strong"}`}
                    style={{ height: m.count ? `${(m.count / maxMonth) * 100}%` : "2px" }}
                  />
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="mt-2 flex gap-1.5 text-center text-[11px] text-ink-soft sm:gap-3">
              {stats.months.map((m) => (
                <span key={m.month} className="flex-1 capitalize">
                  {monthLabel(m.month, "short").replace(".", "")}
                </span>
              ))}
            </div>
            <table className="sr-only">
              <caption>Cómics leídos por mes</caption>
              <tbody>
                {stats.months.map((m) => (
                  <tr key={m.month}>
                    <th scope="row">{monthLabel(m.month, "long")}</th>
                    <td>{m.count}</td>
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
