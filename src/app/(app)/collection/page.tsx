import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { CharacterCard, LockedCard } from "@/components/characters/character-card";
import { MarkCollectionSeen } from "@/components/collection/mark-seen";
import { inkTab as tab, PageHeader, quietLink as sortLink } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { filterCards, type CollectionCardDto } from "@/server/dto/character";
import { getCollection } from "@/server/services/discovery";
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

type Slot = { kind: "card"; card: CollectionCardDto } | { kind: "locked"; number: number };

/**
 * En orden de catálogo y sin filtro, los huecos bloqueados quedan en su sitio (como en
 * un álbum): al desbloquear, la viñeta se entinta sin que la página se recoloque.
 */
function toSlots(cards: CollectionCardDto[], lockedNumbers: number[], inPlace: boolean): Slot[] {
  const slots: Slot[] = cards.map((card) => ({ kind: "card", card }));
  const locked: Slot[] = lockedNumbers.map((number) => ({ kind: "locked", number }));
  if (!inPlace) return [...slots, ...locked];
  const numberOf = (s: Slot) => (s.kind === "card" ? (s.card.number ?? Infinity) : s.number);
  return [...slots, ...locked].sort((a, b) => numberOf(a) - numberOf(b));
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const parsed = collectionSearchSchema.safeParse(normalizeParams(await searchParams));
  const input = parsed.success ? parsed.data : collectionSearchSchema.parse({});
  const full = await getCollection(db, user.id);
  const { progress, relationships, counts } = full;
  const slots = toSlots(
    filterCards(full.cards, input),
    input.filter === "all" ? full.lockedNumbers : [],
    input.sort === "number",
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Mi colección"
        figure={
          <>
            {progress.unlocked}
            <span className="text-2xl text-ink-soft">/{progress.total}</span>
          </>
        }
        figureLabel="personajes"
      >
        <p className="px-4 py-2 text-xs text-ink-soft">
          {relationships.discovered} de {relationships.total} relaciones descubiertas ·{" "}
          <Link href="/graph" className="text-ink underline">
            ver el universo
          </Link>
        </p>
      </PageHeader>

      {progress.unlocked === 0 && (
        <p className="mt-4 max-w-prose text-sm text-ink-soft">
          Tu página está a lápiz. Marca un cómic como leído y se entintarán los personajes que
          aparecen en él.{" "}
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
      </div>

      {slots.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No hay personajes en este filtro.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {slots.map((slot) =>
            slot.kind === "card" ? (
              <li key={slot.card.id}>
                <CharacterCard card={slot.card} total={progress.total} />
              </li>
            ) : (
              <li key={`locked-${slot.number}`}>
                <LockedCard number={slot.number} total={progress.total} />
              </li>
            ),
          )}
        </ul>
      )}
      {full.cards.some((c) => c.isNew) && <MarkCollectionSeen />}
    </main>
  );
}
