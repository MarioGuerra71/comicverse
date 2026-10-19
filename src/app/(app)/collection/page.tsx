import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { CharacterCard } from "@/components/characters/character-card";
import { MarkCollectionSeen } from "@/components/collection/mark-seen";
import { AlbumShelf } from "@/components/collection/album-shelf";
import { PageHeader, segment, segmentGroup } from "@/components/ui/page-parts";
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

      {/* Una sola barra, como la de la biblioteca: filtro a la izquierda, orden a la derecha. */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <nav aria-label="Filtrar la colección" className="-ml-4 min-w-0 overflow-x-auto pl-4 scrollbar-none md:ml-0 md:pl-0">
          <div className={segmentGroup}>
            {/* Los filtros vacíos no ocupan sitio (salvo si es el que estás viendo). */}
            {FILTERS.filter((f) => counts[f.value] > 0 || f.value === input.filter || f.value === "all").map((f) => (
              <Link
                key={f.value}
                href={collectionHref({ ...input, filter: f.value })}
                aria-current={input.filter === f.value ? "page" : undefined}
                className={`${segment(input.filter === f.value)} whitespace-nowrap`}
              >
                {f.label}
                <span className="text-xs font-normal text-ink-soft tabular-nums">{counts[f.value]}</span>
              </Link>
            ))}
          </div>
        </nav>
        {input.filter !== "all" && (
          <nav aria-label="Ordenar" className={segmentGroup}>
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={collectionHref({ ...input, sort: s.value })}
                aria-current={input.sort === s.value ? "true" : undefined}
                className={`${segment(input.sort === s.value)} whitespace-nowrap`}
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
