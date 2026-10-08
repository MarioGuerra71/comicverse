import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { pluralize } from "@/lib/format";
import { READING_STATUS_LABELS } from "@/lib/reading-status";
import { RELATIONSHIP_TYPE_LABELS } from "@/lib/relationship-types";
import { ComicCard } from "@/components/comics/comic-card";
import { CARD_STATE_LABELS } from "@/components/characters/character-card";
import { FavoriteButton } from "@/components/characters/favorite-button";
import { SectionHeading } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getCharacterDetail } from "@/server/services/discovery";

// cache: la página y su título comparten una sola consulta por petición.
// Bloqueado o inexistente: null (el título no revela el nombre).
const loadCharacter = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) return null;
  const user = await requireUser();
  return getCharacterDetail(db, user.id, id);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const character = await loadCharacter((await params).id);
  return { title: character ? `${character.name} · ComicVerse` : "ComicVerse" };
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Bloqueado, inexistente o id no válido: la misma página 404.
  const character = await loadCharacter((await params).id);
  if (!character) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/collection" className="text-ink underline">
          ← Volver a mi colección
        </Link>
        <Link href={`/graph?focus=${character.id}`} className="text-ink underline">
          Ver en el grafo →
        </Link>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="relative aspect-3/4 w-full max-w-64 overflow-hidden border-2 border-ink bg-sheet">
          {character.imageUrl ? (
            <Image
              src={character.imageUrl}
              alt={`Imagen de ${character.name}`}
              fill
              unoptimized
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{character.name}</h1>
            {/* Estado como anotación a lápiz, igual que bajo las viñetas de la colección. */}
            <p className="font-hand text-xl leading-tight font-bold text-editor-ink">
              {CARD_STATE_LABELS[character.state].toLowerCase()}
            </p>
            {character.realName && (
              <p className="mt-1 text-sm text-ink-soft">{character.realName}</p>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y-2 border-ink py-2 text-sm text-ink">
            {character.publisher && (
              <>
                <dt className="text-ink-soft">Editorial</dt>
                <dd>{character.publisher}</dd>
              </>
            )}
            {character.firstAppearance && (
              <>
                <dt className="text-ink-soft">Primera aparición</dt>
                <dd>
                  <Link href={`/comics/${character.firstAppearance.id}`} className="text-ink underline">
                    {character.firstAppearance.title}
                  </Link>
                </dd>
              </>
            )}
            <dt className="text-ink-soft">Tus lecturas</dt>
            <dd>
              {pluralize(character.comicsRead, "cómic leído", "cómics leídos")} de{" "}
              {pluralize(character.comics.length, "cómic en tu biblioteca", "cómics en tu biblioteca")}
            </dd>
            {character.appearancesCount !== null && (
              <>
                <dt className="text-ink-soft">Apariciones totales</dt>
                <dd>{character.appearancesCount} (según Comic Vine)</dd>
              </>
            )}
          </dl>

          <FavoriteButton characterId={character.id} isFavorite={character.isFavorite} />

          {character.summary && (
            <p className="max-w-prose text-sm leading-relaxed text-ink">
              {character.summary}
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="relationships-heading" className="mt-8">
        <SectionHeading id="relationships-heading" title="Relaciones descubiertas" />
        {character.relationships.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {character.relationships.map(({ character: other, shared, type }) => (
              <li key={other.id}>
                <Link
                  href={`/characters/${other.id}`}
                  className="flex min-h-11 items-center border-2 border-ink bg-sheet px-3 text-sm font-semibold text-ink transition-colors hover:bg-sheet-raised"
                >
                  {other.name}
                  {type && (
                    <span className="ml-2 font-hand text-lg leading-none text-editor-ink">
                      {RELATIONSHIP_TYPE_LABELS[type]}
                    </span>
                  )}
                  {shared > 0 && (
                    <span className="ml-2 font-normal text-ink-soft">
                      {pluralize(shared, "cómic juntos", "cómics juntos")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Aún no has descubierto a ningún personaje relacionado.
          </p>
        )}
        {character.hiddenRelationships > 0 && (
          <p className="mt-3 text-sm text-ink-soft">
            Y {pluralize(character.hiddenRelationships, "relación", "relaciones")} por
            descubrir.
          </p>
        )}
      </section>

      <section aria-labelledby="comics-heading" className="mt-8">
        <SectionHeading id="comics-heading" title="En tu biblioteca" href="/library" linkLabel="Ver biblioteca" />
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
          {character.comics.map(({ comic, status }) => (
            <li key={comic.id} className="flex flex-col">
              <ComicCard comic={comic} />
              <p className="mt-1 font-hand text-lg leading-tight font-bold text-ink">
                {READING_STATUS_LABELS[status].toLowerCase()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
