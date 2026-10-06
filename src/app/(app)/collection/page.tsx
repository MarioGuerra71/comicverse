import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { CharacterCard, LockedCard } from "@/components/characters/character-card";
import { requireUser } from "@/server/auth/session";
import { getCollection } from "@/server/services/discovery";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
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
  { value: "name", label: "Nombre" },
  { value: "comics", label: "Más leídos" },
] as const;

function collectionHref({ filter, sort }: CollectionSearchInput) {
  const query = new URLSearchParams();
  if (filter !== "all") query.set("filter", filter);
  if (sort !== "name") query.set("sort", sort);
  const queryString = query.toString();
  return queryString ? `/collection?${queryString}` : "/collection";
}

const pillClass = "flex min-h-11 items-center rounded-md border border-foreground/20 px-3 text-sm";
const activeClass = "bg-foreground text-background";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const parsed = collectionSearchSchema.safeParse(normalizeParams(await searchParams));
  const input = parsed.success ? parsed.data : collectionSearchSchema.parse({});
  const { cards, locked, counts, progress, relationships } = await getCollection(
    db,
    user.id,
    input,
  );
  const percent = progress.total
    ? Math.round((progress.unlocked / progress.total) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Mi colección</h1>

      <div className="mt-4 max-w-md">
        <p className="text-sm">
          <span className="font-semibold">
            {progress.unlocked} / {progress.total}
          </span>{" "}
          personajes descubiertos ({percent}%)
        </p>
        <progress
          value={progress.unlocked}
          max={progress.total || 1}
          aria-label="Progreso de la colección"
          className="mt-2 h-2 w-full overflow-hidden rounded-full accent-foreground"
        />
        <p className="mt-2 text-sm opacity-80">
          Relaciones descubiertas: {relationships.discovered} / {relationships.total}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrar la colección" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={collectionHref({ ...input, filter: f.value })}
              aria-current={input.filter === f.value ? "page" : undefined}
              className={`${pillClass} ${input.filter === f.value ? activeClass : ""}`}
            >
              {f.label} ({counts[f.value]})
            </Link>
          ))}
        </nav>
        <nav aria-label="Ordenar" className="flex items-center gap-2 text-sm">
          <span className="opacity-70">Ordenar:</span>
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={collectionHref({ ...input, sort: s.value })}
              aria-current={input.sort === s.value ? "true" : undefined}
              className={`${pillClass} ${input.sort === s.value ? activeClass : ""}`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {cards.length === 0 && input.filter !== "all" && (
        <p className="mt-6 text-sm opacity-80">No hay personajes en este filtro.</p>
      )}

      {cards.length === 0 && input.filter === "all" && (
        <p className="mt-6 text-sm opacity-80">
          Aún no has descubierto ningún personaje. Marca un cómic como leído para
          desbloquear los que aparecen en él.{" "}
          <Link href="/catalog" className="underline">
            Ir al catálogo
          </Link>
        </p>
      )}

      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {cards.map((card) => (
          <li key={card.id}>
            <CharacterCard card={card} />
          </li>
        ))}
        {Array.from({ length: locked }, (_, index) => (
          <li key={`locked-${index}`}>
            <LockedCard />
          </li>
        ))}
      </ul>
    </main>
  );
}
