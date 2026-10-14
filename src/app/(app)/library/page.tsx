import { ZONES } from "@/lib/zones";
import { getZone } from "@/server/zone";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { READING_STATUS_LABELS, READING_STATUSES } from "@/lib/reading-status";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { SelectableComicGrid } from "@/components/library/selectable-comic-grid";
import { inkTab, PageHeader, Pagination } from "@/components/ui/page-parts";
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

  const zone = await getZone();
  const result = await listLibrary(db, user.id, input, zone);
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
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title={`Mi biblioteca ${ZONES[zone].label}`} figure={totalInLibrary} figureLabel={totalInLibrary === 1 ? "cómic" : "cómics"} />

      {/* En el móvil, las pestañas se desplazan en horizontal en vez de partirse. */}
      <nav
        aria-label="Estados de lectura"
        className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 whitespace-nowrap scrollbar-none md:mx-0 md:px-0"
      >
        {tabs.map((tab) => {
          const active = tab.status === input.status;
          return (
            <Link
              key={tab.label}
              href={libraryHref(tab.status)}
              aria-current={active ? "page" : undefined}
              className={inkTab(active)}
            >
              {tab.label}
              <span className="ml-1.5 font-normal">{tab.count}</span>
            </Link>
          );
        })}
      </nav>

      {result.items.length === 0 ? (
        <div className="mt-10">
          <p className="text-ink">
            {input.status
              ? `No tienes cómics en «${READING_STATUS_LABELS[input.status]}».`
              : "Aún no tienes cómics en tu biblioteca."}
          </p>
          <Link href="/catalog" className="mt-2 inline-block text-sm text-ink underline">
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <SelectableComicGrid
          items={result.items.map((item) => ({
            comic: item.comic,
            // Notas a lápiz del lector bajo la portada, como en el Inicio.
            note:
              [
                !input.status && READING_STATUS_LABELS[item.status].toLowerCase(),
                item.rating !== null && `${item.rating}/5`,
                item.isFavorite && "favorito",
              ]
                .filter(Boolean)
                .join(" · ") || undefined,
          }))}
        />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(page) => libraryHref(input.status, page)}
      />
    </main>
  );
}
