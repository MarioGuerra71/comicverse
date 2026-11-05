import { ZONES } from "@/lib/zones";
import { getZone } from "@/server/zone";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { READING_STATUS_LABELS, READING_STATUSES } from "@/lib/reading-status";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { SelectableComicGrid } from "@/components/library/selectable-comic-grid";
import { SeriesShelf } from "@/components/library/series-shelf";
import { ArrowIcon, FolderIcon, GridIcon } from "@/components/ui/icons";
import { inkField, PageHeader, Pagination, segment, segmentGroup } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { listLibrary, listLibrarySeries } from "@/server/services/library";
import { librarySearchSchema, type LibrarySearchInput } from "@/server/validation/library";

export const metadata: Metadata = { title: "Mi biblioteca · ComicVerse" };

const VIEWS = [
  { value: "comics", label: "Cómics", Icon: GridIcon },
  { value: "series", label: "Series", Icon: FolderIcon },
] as const;

const ORDERS = [
  { value: "recent", label: "Recientes" },
  { value: "closest", label: "Casi terminadas" },
  { value: "rating", label: "Mejor nota" },
  { value: "name", label: "A-Z" },
] as const;

const SORTS = [
  { value: "recent", label: "Recientes" },
  { value: "rating", label: "Mejor nota" },
] as const;

const NOTAS = [
  { value: undefined, label: "Todas" },
  ...(["5", "4", "3", "2", "1"] as const).map((value) => ({ value, label: `★${value}` })),
  { value: "sin", label: "Sin nota" },
] as const;

type HrefInput = Partial<Pick<LibrarySearchInput, "status" | "view" | "series" | "order" | "page" | "q" | "sort" | "nota">>;

function libraryHref({ status, view, series, order, page, q, sort, nota }: HrefInput) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  // «Series» es la vista por defecto: solo la otra va en la URL.
  if (view === "comics") query.set("view", view);
  if (series) query.set("series", series);
  if (q) query.set("q", q);
  if (view !== "comics" && !series && order && order !== "recent") query.set("order", order);
  // Orden y nota son de la rejilla de cómics (vista «Cómics» o una carpeta abierta).
  if ((view === "comics" || series) && sort && sort !== "recent") query.set("sort", sort);
  if ((view === "comics" || series) && nota) query.set("nota", nota);
  if (page && page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString ? `/library?${queryString}` : "/library";
}

/** Fila de opciones en texto (subrayada la activa), como el orden de las carpetas. */
function OptionRow({ label, options }: { label: string; options: { key: string; label: string; href: string; active: boolean }[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-x-4 text-sm">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          aria-current={o.active ? "true" : undefined}
          className={`inline-flex min-h-11 items-center underline-offset-4 ${
            o.active ? "font-semibold text-ink underline" : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
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
  // En «Por series» sin carpeta abierta se ven las carpetas; al abrir una, sus cómics.
  const showFolders = input.view === "series" && !input.series;
  const [result, folders] = await Promise.all([
    listLibrary(db, user.id, input, zone),
    showFolders ? listLibrarySeries(db, user.id, input.status, zone, input.order, input.q) : null,
  ]);
  const openSeries = input.series ? result.items[0]?.comic.series : undefined;
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

      {/* Una sola barra: estado de lectura a la izquierda, vista a la derecha. En el móvil, el estado se desplaza. */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <nav aria-label="Estados de lectura" className="-ml-4 min-w-0 overflow-x-auto pl-4 scrollbar-none md:ml-0 md:pl-0">
          <div className={segmentGroup}>
            {/* Los estados vacíos no ocupan sitio (salvo si es el que estás viendo). */}
            {tabs
              .filter((tab) => tab.count > 0 || tab.status === input.status || !tab.status)
              .map((tab) => {
                const active = tab.status === input.status;
                return (
                  <Link
                    key={tab.label}
                    href={libraryHref({ ...input, status: tab.status, page: 1 })}
                    aria-current={active ? "page" : undefined}
                    className={`${segment(active)} whitespace-nowrap`}
                  >
                    {tab.label}
                    <span className="text-xs font-normal text-ink-soft tabular-nums">{tab.count}</span>
                  </Link>
                );
              })}
          </div>
        </nav>
        <nav aria-label="Vista" className={segmentGroup}>
          {VIEWS.map(({ value, label, Icon }) => (
            <Link
              key={value}
              href={libraryHref({ status: input.status, view: value, order: input.order })}
              aria-current={input.view === value ? "page" : undefined}
              aria-label={label}
              title={label}
              className={`${segment(input.view === value)} px-2.5 sm:px-3.5`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Buscador: en las carpetas, por serie; en los cómics, por título («green lantern 21»). */}
      <form action="/library" role="search" className="mt-4 flex max-w-md gap-2">
        {input.status && <input type="hidden" name="status" value={input.status} />}
        {input.view === "comics" && <input type="hidden" name="view" value="comics" />}
        {input.series && <input type="hidden" name="series" value={input.series} />}
        <input
          type="search"
          name="q"
          defaultValue={input.q ?? ""}
          placeholder={showFolders ? "Buscar una serie…" : "Buscar un cómic (p. ej. green lantern 21)…"}
          aria-label={showFolders ? "Buscar una serie" : "Buscar un cómic"}
          className={`${inkField} flex-1`}
        />
      </form>

      {showFolders ? (
        <div className="mt-2">
          <OptionRow
            label="Orden de las series"
            options={ORDERS.map((o) => ({
              key: o.value,
              label: o.label,
              href: libraryHref({ status: input.status, view: "series", order: o.value, q: input.q }),
              active: input.order === o.value,
            }))}
          />
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-x-8">
          <OptionRow
            label="Orden de los cómics"
            options={SORTS.map((o) => ({
              key: o.value,
              label: o.label,
              href: libraryHref({ ...input, sort: o.value, page: 1 }),
              active: input.sort === o.value,
            }))}
          />
          <OptionRow
            label="Filtrar por tu nota"
            options={NOTAS.map((o) => ({
              key: o.value ?? "todas",
              label: o.label,
              href: libraryHref({ ...input, nota: o.value, page: 1 }),
              active: input.nota === o.value,
            }))}
          />
        </div>
      )}

      {input.series && (
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-3">
          <Link
            href={libraryHref({ status: input.status, view: "series", order: input.order })}
            aria-label="Volver a las series"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowIcon direction="left" size={16} />
            Series
          </Link>
          {openSeries && (
            <h2 className="text-base font-bold text-ink">
              <span aria-hidden="true" className="mr-3 font-normal text-ink-soft">/</span>
              {openSeries.name}
              {openSeries.startYear && <span className="font-normal text-ink-soft"> ({openSeries.startYear})</span>}
            </h2>
          )}
        </div>
      )}

      {folders ? (
        folders.length === 0 ? (
          <p className="mt-10 text-ink">
            {input.q
              ? `Ninguna de tus series se llama «${input.q}».`
              : input.status
                ? `No tienes series con cómics en «${READING_STATUS_LABELS[input.status]}».`
                : "Aún no tienes cómics en tu biblioteca."}
          </p>
        ) : (
          <SeriesShelf series={folders} hrefFor={(series) => libraryHref({ status: input.status, view: "series", series })} />
        )
      ) : result.items.length === 0 ? (
        <div className="mt-10">
          <p className="text-ink">
            {input.q || input.nota
              ? "No hay cómics que cumplan esa búsqueda o ese filtro."
              : input.status
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

      {!folders && (
        <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(page) => libraryHref({ ...input, page })} />
      )}
    </main>
  );
}
