import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { buildCatalogHref } from "@/lib/catalog-url";
import { ComicCard } from "@/components/comics/comic-card";
import { inkButton, inkField, PageHeader, Pagination } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { listSeries, searchComics } from "@/server/services/catalog";
import { comicSearchSchema } from "@/server/validation/catalog";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { ZONES } from "@/lib/zones";
import { getZone } from "@/server/zone";

export const metadata: Metadata = { title: "Catálogo · ComicVerse" };

const SORT_OPTIONS = [
  { value: "release_desc", label: "Más recientes primero" },
  { value: "release_asc", label: "Más antiguos primero" },
  { value: "title", label: "Título (A-Z)" },
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();

  const parsed = comicSearchSchema.safeParse(
    normalizeParams(await searchParams),
  );
  const zone = await getZone();
  // El catálogo siempre es el de la zona elegida (Marvel o DC).
  const input = { ...(parsed.success ? parsed.data : comicSearchSchema.parse({})), publisher: zone };

  const [result, series] = await Promise.all([
    searchComics(db, input),
    listSeries(db, zone),
  ]);

  const hrefFor = (page: number) =>
    buildCatalogHref({
      q: input.q,
      seriesId: input.seriesId,
      sort: input.sort,
      page,
    });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title={`Catálogo ${ZONES[zone].label}`} figure={result.total} figureLabel={result.total === 1 ? "cómic" : "cómics"} />

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={input.q ?? ""}
          placeholder="Buscar por título o historia"
          aria-label="Buscar cómics"
          className={`${inkField} min-w-56 flex-1`}
        />
        <select
          name="seriesId"
          defaultValue={input.seriesId ?? ""}
          aria-label="Serie"
          className={`${inkField} max-w-full`}
        >
          <option value="">Todas las series</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.startYear ? `${s.name} (${s.startYear})` : s.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={input.sort}
          aria-label="Orden"
          className={`${inkField} max-w-full`}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={inkButton}
        >
          Buscar
        </button>
      </form>

      {result.items.length === 0 ? (
        <div className="mt-10">
          <p className="text-ink">
            {series.length === 0
              ? `Aún no hay cómics de ${ZONES[zone].label} en el catálogo. Muy pronto podrás buscarlos aquí.`
              : "No hay cómics que coincidan con la búsqueda."}
          </p>
          {series.length > 0 && (
            <Link href="/catalog" className="mt-2 inline-block text-sm text-ink underline">
              Ver todo el catálogo
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {result.items.map((comic, index) => (
            <li key={comic.id}>
              <ComicCard comic={comic} eager={index < 6} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
    </main>
  );
}
