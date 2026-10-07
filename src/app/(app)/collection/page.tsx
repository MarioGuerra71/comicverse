import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { CharacterCard, LockedCard } from "@/components/characters/character-card";
import { Sky } from "@/components/collection/sky";
import { MarkCollectionSeen } from "@/components/collection/mark-seen";
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

// La ordenación es secundaria: enlaces discretos (con 44 px de zona táctil por relleno).
const sortLink = (active: boolean) =>
  `flex min-h-11 items-center px-2 text-sm underline-offset-[6px] transition-colors ${
    active ? "text-star underline" : "text-dim hover:text-star"
  }`;

const pill = (active: boolean) =>
  `flex min-h-11 items-center rounded-md border px-3 text-sm transition-colors ${
    active
      ? "border-line-strong bg-plate-raised text-star"
      : "border-line text-dim hover:border-line-strong hover:text-star"
  }`;

type Slot = { kind: "card"; card: CollectionCardDto } | { kind: "locked"; number: number };

/**
 * En orden de catálogo y sin filtro, los huecos bloqueados quedan en su sitio (como en
 * un álbum): al desbloquear, la casilla cambia sin que la rejilla se recoloque.
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
  // Una sola consulta: el cielo usa la colección completa y la rejilla, la filtrada.
  const full = await getCollection(db, user.id);
  const { progress, relationships, counts } = full;
  const showLocked = input.filter === "all";
  const slots = toSlots(
    filterCards(full.cards, input),
    showLocked ? full.lockedNumbers : [],
    input.sort === "number",
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-3xl tracking-wide text-star md:text-4xl">Mi colección</h1>
        <p className="text-sm text-dim">
          <span className="text-2xl font-semibold tabular-nums text-star">{progress.unlocked}</span> / {progress.total}{" "}
          personajes · {relationships.discovered} / {relationships.total} relaciones
        </p>
      </header>

      <div className="mt-4">
        <Sky
          total={progress.total}
          stars={full.cards
            .filter((c) => c.number !== null)
            .map((c) => ({
              id: c.id,
              number: c.number!,
              name: c.name,
              comicsRead: c.comicsRead,
              collected: c.state === "COLLECTED",
              isNew: c.isNew,
            }))}
          lockedNumbers={full.lockedNumbers}
          constellations={full.constellations}
        />
      </div>

      {progress.unlocked === 0 && (
        <p className="mt-4 max-w-prose text-sm text-dim">
          Tu cielo está a oscuras. Marca un cómic como leído y se encenderán los personajes
          que aparecen en él.{" "}
          <Link href="/catalog" className="text-star underline">
            Ir al catálogo
          </Link>
        </p>
      )}

      {/* En el móvil, cada fila se desplaza en horizontal en vez de partirse. */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label="Filtrar la colección"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 whitespace-nowrap [scrollbar-width:none] md:mx-0 md:px-0"
        >
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={collectionHref({ ...input, filter: f.value })}
              aria-current={input.filter === f.value ? "page" : undefined}
              className={pill(input.filter === f.value)}
            >
              {f.label}
              <span className="ml-1.5 text-dim">{counts[f.value]}</span>
            </Link>
          ))}
        </nav>
        <nav
          aria-label="Ordenar"
          className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 text-sm whitespace-nowrap [scrollbar-width:none] md:mx-0 md:px-0"
        >
          <span className="text-dim">Ordenar</span>
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
        <p className="mt-8 text-sm text-dim">No hay personajes en este filtro.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
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
