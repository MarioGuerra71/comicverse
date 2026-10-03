import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { buildCatalogHref } from "@/lib/catalog-url";
import { ComicCard } from "@/components/comics/comic-card";
import { requireUser } from "@/server/auth/session";
import { listSeries, searchComics } from "@/server/services/catalog";
import { comicSearchSchema } from "@/server/validation/catalog";

export const metadata: Metadata = { title: "Catálogo · ComicVerse" };

type SearchParams = Record<string, string | string[] | undefined>;

// Toma el primer valor de cada parámetro y descarta los vacíos.
function normalizeParams(params: SearchParams) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      return [key, first === "" ? undefined : first];
    }),
  );
}

const SORT_OPTIONS = [
  { value: "release_desc", label: "Más recientes primero" },
  { value: "release_asc", label: "Más antiguos primero" },
  { value: "title", label: "Título (A-Z)" },
];

const controlClass =
  "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();

  const parsed = comicSearchSchema.safeParse(normalizeParams(await searchParams));
  const input = parsed.success ? parsed.data : comicSearchSchema.parse({});

  const [result, series] = await Promise.all([
    searchComics(db, input),
    listSeries(db),
  ]);

  const hrefFor = (page: number) =>
    buildCatalogHref({
      q: input.q,
      seriesId: input.seriesId,
      sort: input.sort,
      page,
    });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Catálogo</h1>

      <form method="get" className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={input.q ?? ""}
          placeholder="Buscar por título o historia"
          aria-label="Buscar cómics"
          className={`${controlClass} min-w-56 flex-1`}
        />
        <select
          name="seriesId"
          defaultValue={input.seriesId ?? ""}
          aria-label="Serie"
          className={controlClass}
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
          className={controlClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Buscar
        </button>
      </form>

      <p className="mt-4 text-sm opacity-70">
        {result.total} {result.total === 1 ? "cómic" : "cómics"}
      </p>

      {result.items.length === 0 ? (
        <div className="mt-10 text-center">
          <p>No hay cómics que coincidan con la búsqueda.</p>
          <Link href="/catalog" className="mt-2 inline-block text-sm underline">
            Ver todo el catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {result.items.map((comic) => (
            <li key={comic.id}>
              <ComicCard comic={comic} />
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
            <Link href={hrefFor(result.page - 1)} className="underline">
              ← Anterior
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="opacity-70">
            Página {result.page} de {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Link href={hrefFor(result.page + 1)} className="underline">
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