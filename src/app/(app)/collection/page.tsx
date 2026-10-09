import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { CharacterCard } from "@/components/characters/character-card";
import { MarkCollectionSeen } from "@/components/collection/mark-seen";
import { AlbumShelf } from "@/components/collection/album-shelf";
import { inkTab as tab, PageHeader, quietLink as sortLink } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getZoneCollection } from "@/server/services/discovery";
import { getZone } from "@/server/zone";
import { ZONES } from "@/lib/zones";
import {
  collectionSearchSchema,
  type CollectionSearchInput,
} from "@/server/validation/collection";

export const metadata: Metadata = { title: "Mi colección · ComicVerse" };

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "favorites", label: "Favoritos" },
  { value: "discovered", label: "Descubiertos" },
  { value: "collected", label: "Coleccionados" },
] as const;

const SORTS = [
  { value: "number", label: "Número" },
  { value: "name", label: "Nombre" },
  { value: "comics", label: "Más leídos" },
] as const;

function collectionHref({ filter, sort }: CollectionSearchInput) {
  const query = new URLSearchParams();
  if (filter !== "all") query.set("filter", filter);
  if (sort !== "number") query.set("sort", sort);
  const queryString = query.toString();
  return queryString ? `/collection?${queryString}` : "/collection";
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const parsed = collectionSearchSchema.safeParse(normalizeParams(await searchParams));
  const input = parsed.success ? parsed.data : collectionSearchSchema.parse({});
  const zone = await getZone();
  const { albums, cards, counts, progress, hasNew } = await getZoneCollection(db, user.id, zone, input);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title={`Mi colección ${ZONES[zone].label}`}
        figure={
          <>
            {progress.unlocked}
            <span className="text-2xl text-ink-soft">/{progress.total}</span>
          </>
        }
        figureLabel="personajes"
      >
        <p className="px-4 py-2 text-xs text-ink-soft">
          Un álbum por cada serie de tu biblioteca. Ábrelo y lee sus cómics para entintar los cromos ·{" "}
          <Link href="/graph" className="text-ink underline">
            ver el universo
          </Link>
        </p>
      </PageHeader>

      {albums.length === 0 && (
        <p className="mt-4 max-w-prose text-sm text-ink-soft">
          Aún no tienes álbumes de {ZONES[zone].label}. Añade un cómic a tu biblioteca y su serie aparecerá
          aquí con sus personajes por descubrir.{" "}
          <Link href="/catalog" className="text-ink underline">
            Ir al catálogo
          </Link>
        </p>
      )}

      {/* En el móvil, cada fila se desplaza en horizontal en vez de partirse. */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label="Filtrar la colección"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 whitespace-nowrap scrollbar-none md:mx-0 md:px-0"
        >
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={collectionHref({ ...input, filter: f.value })}
              aria-current={input.filter === f.value ? "page" : undefined}
              className={tab(input.filter === f.value)}
            >
              {f.label}
              <span className="ml-1.5 font-normal">{counts[f.value]}</span>
            </Link>
          ))}
        </nav>
        {input.filter !== "all" && (
          <nav
            aria-label="Ordenar"
            className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 text-sm whitespace-nowrap scrollbar-none md:mx-0 md:px-0"
          >
            <span className="text-ink-soft">Ordenar</span>
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={collectionHref({ ...input, sort: s.value })}
                aria-current={input.sort === s.value ? "true" : undefined}
                className={sortLink(input.sort === s.value)}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {input.filter === "all" ? (
        <AlbumShelf albums={albums} />
      ) : cards.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No hay personajes en este filtro.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {cards.map((card) => (
            <li key={card.id}>
              <CharacterCard card={card} total={progress.total} />
            </li>
          ))}
        </ul>
      )}
      {/* En la estantería, lo nuevo se da por visto al abrir su álbum, no aquí. */}
      {hasNew && input.filter !== "all" && <MarkCollectionSeen />}
    </main>
  );
}
