import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { TrophyIcon } from "@/components/ui/icons";
import { PageHeader, SectionHeading } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import type { AchievementGroup } from "@/server/domain/achievements";
import { getAchievementsPage, type AchievementDto } from "@/server/services/achievements";

export const metadata: Metadata = { title: "Logros · ComicVerse" };

const GROUPS: { key: AchievementGroup; title: string }[] = [
  { key: "READING", title: "Lectura" },
  { key: "COLLECTION", title: "Colección y álbumes" },
  { key: "PUBLISHERS", title: "Marvel y DC" },
];

const pad = (n: number) => String(n).padStart(3, "0");

function Badge({ item }: { item: AchievementDto }) {
  const earned = item.earnedAt !== null;
  const hidden = item.description === null;
  const percent = item.current !== null && item.target ? Math.round((item.current / item.target) * 100) : 0;
  return (
    <li
      className={`flex gap-4 p-4 ${
        earned ? "rounded-2xl border border-editor/40 bg-editor/5" : "rounded-2xl border border-dashed border-blue bg-sheet"
      }`}
    >
      {/* Sello: encendido en neón si está conseguido, trazo azul tenue si no. */}
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
          earned ? "bg-editor/15 text-editor ring-1 ring-editor shadow-[0_0_18px_var(--glow)]" : "border border-dashed border-blue text-blue-ink"
        }`}
      >
        {hidden ? <span className="font-display text-2xl font-extrabold">?</span> : <TrophyIcon size={26} />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className={`leading-tight font-extrabold ${earned ? "text-ink" : hidden ? "text-blue-ink" : "text-ink"}`}>
          {item.title}
        </h3>
        <p className="mt-0.5 text-sm text-ink-soft">{hidden ? "Logro secreto: sigue leyendo para descubrirlo." : item.description}</p>
        {earned ? (
          <p className="mt-2 font-hand text-lg leading-none font-bold text-editor-ink">
            conseguido el {formatDate(item.earnedAt!.slice(0, 10))}
          </p>
        ) : (
          item.current !== null &&
          item.target !== null && (
            <div className="mt-2">
              <span className="font-display text-lg leading-none font-extrabold text-ink">
                {item.target >= 100 && item.id.startsWith("album") ? `${item.current} %` : `${pad(item.current)}/${pad(item.target)}`}
              </span>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sheet-raised" aria-hidden="true">
                <div className="h-full rounded-full bg-editor" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )
        )}
      </div>
    </li>
  );
}

export default async function AchievementsPage() {
  const user = await requireUser();
  const { items, earned, total } = await getAchievementsPage(db, user.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Logros"
        figure={
          <>
            {pad(earned)}
            <span className="text-2xl text-ink-soft">/{pad(total)}</span>
          </>
        }
        figureLabel="conseguidos"
      >
        <p className="px-4 py-2 text-xs text-ink-soft">
          Se consiguen leyendo y completando tus álbumes. Una vez conseguido, un logro es tuyo para siempre.
        </p>
      </PageHeader>

      {GROUPS.map((group) => (
        <section key={group.key} aria-labelledby={`group-${group.key}`} className="mt-10">
          <SectionHeading id={`group-${group.key}`} title={group.title} />
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter((i) => i.group === group.key)
              // Primero los conseguidos, después los más avanzados.
              .sort(
                (a, b) =>
                  Number(b.earnedAt !== null) - Number(a.earnedAt !== null) ||
                  (b.current ?? -1) / (b.target ?? 1) - (a.current ?? -1) / (a.target ?? 1),
              )
              .map((item) => (
                <Badge key={item.id} item={item} />
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
