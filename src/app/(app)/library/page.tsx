import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { READING_STATUS_LABELS, READING_STATUSES } from "@/lib/reading-status";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { ComicCard } from "@/components/comics/comic-card";
import { requireUser } from "@/server/auth/session";
import { listLibrary } from "@/server/services/library";
import { librarySearchSchema } from "@/server/validation/library";

export const metadata: Metadata = { title: "Mi biblioteca · ComicVerse" };

function libraryHref(status?: string, page?: number) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (page && page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString ? `/library?${queryString}` : "/library";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();

  const parsed = librarySearchSchema.safeParse(
    normalizeParams(await searchParams),
  );
  const input = parsed.success ? parsed.data : librarySearchSchema.parse({});

  const result = await listLibrary(db, user.id, input);
  const totalInLibrary = Object.values(result.counts).reduce((a, b) => a + b, 0);

  const tabs = [
    { status: undefined, label: "Todos", count: totalInLibrary },
    ...READING_STATUSES.map((status) => ({
      status,
      label: READING_STATUS_LABELS[status],
      count: result.counts[status],
    })),
  ];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Mi biblioteca</h1>

      <nav aria-label="Estados de lectura" className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.status === input.status;
          return (
            <Link
              key={tab.label}
              href={libraryHref(tab.status)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-md border border-foreground/20 px-3 text-sm ${
                active ? "bg-foreground text-background" : ""
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </nav>

      {result.items.length === 0 ? (
        <div className="mt-10 text-center">
          <p>
            {input.status
              ? `No tienes cómics en «${READING_STATUS_LABELS[input.status]}».`
              : "Aún no tienes cómics en tu biblioteca."}
          </p>
          <Link href="/catalog" className="mt-2 inline-block text-sm underline">
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {result.items.map((item, index) => (
            <li key={item.comic.id} className="flex flex-col gap-1">
              <ComicCard comic={item.comic} eager={index < 6} />
              <p className="text-xs font-medium opacity-80">
                {[
                  !input.status && READING_STATUS_LABELS[item.status],
                  item.rating !== null && `★ ${item.rating}/5`,
                  item.isFavorite && "♥ Favorito",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {result.totalPages > 1 && (
        <nav
          aria-label="Paginación"
          className="mt-8 flex items-center justify-between text-sm"
        >
          {result.page > 1 ? (
            <Link href={libraryHref(input.status, result.page - 1)} className="underline">
              ← Anterior
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="opacity-70">
            Página {result.page} de {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Link href={libraryHref(input.status, result.page + 1)} className="underline">
              Siguiente →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      )}
    </main>
  );
}
