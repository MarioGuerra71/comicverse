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
import { requireUser } from "@/server/auth/session";
import { getCharacterDetail } from "@/server/services/discovery";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  // Bloqueado o inexistente: la misma página 404.
  const character = await getCharacterDetail(db, user.id, id);
  if (!character) notFound();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/collection" className="text-sm underline">
        ← Volver a mi colección
      </Link>

      <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="relative aspect-3/4 w-full max-w-64 overflow-hidden rounded-md bg-foreground/10">
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
            <div className="flex h-full items-center justify-center text-sm opacity-60">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
              {CARD_STATE_LABELS[character.state]}
            </p>
            <h1 className="text-2xl font-bold">{character.name}</h1>
            {character.realName && (
              <p className="mt-1 text-sm opacity-70">{character.realName}</p>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {character.publisher && (
              <>
                <dt className="opacity-60">Editorial</dt>
                <dd>{character.publisher}</dd>
              </>
            )}
            {character.firstAppearance && (
              <>
                <dt className="opacity-60">Primera aparición</dt>
                <dd>
                  <Link href={`/comics/${character.firstAppearance.id}`} className="underline">
                    {character.firstAppearance.title}
                  </Link>
                </dd>
              </>
            )}
            <dt className="opacity-60">Tus lecturas</dt>
            <dd>
              {pluralize(character.comicsRead, "cómic leído", "cómics leídos")} de{" "}
              {pluralize(character.comics.length, "cómic en tu biblioteca", "cómics en tu biblioteca")}
            </dd>
            {character.appearancesCount !== null && (
              <>
                <dt className="opacity-60">Apariciones totales</dt>
                <dd>{character.appearancesCount} (según Comic Vine)</dd>
              </>
            )}
          </dl>

          <FavoriteButton characterId={character.id} isFavorite={character.isFavorite} />

          {character.summary && (
            <p className="max-w-prose text-sm leading-relaxed opacity-90">
              {character.summary}
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="relationships-heading" className="mt-8">
        <h2 id="relationships-heading" className="font-semibold">
          Relaciones descubiertas
        </h2>
        {character.relationships.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {character.relationships.map(({ character: other, shared, type }) => (
              <li key={other.id}>
                <Link
                  href={`/characters/${other.id}`}
                  className="flex min-h-11 items-center rounded-md border border-foreground/20 px-3 text-sm"
                >
                  {other.name}
                  {type && (
                    <span className="ml-2 rounded bg-foreground/10 px-1.5 py-0.5 text-xs font-medium">
                      {RELATIONSHIP_TYPE_LABELS[type]}
                    </span>
                  )}
                  {shared > 0 && (
                    <span className="ml-2 opacity-60">
                      {pluralize(shared, "cómic juntos", "cómics juntos")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm opacity-80">
            Aún no has descubierto a ningún personaje relacionado.
          </p>
        )}
        {character.hiddenRelationships > 0 && (
          <p className="mt-2 text-sm opacity-70">
            Y {pluralize(character.hiddenRelationships, "relación", "relaciones")} por
            descubrir.
          </p>
        )}
      </section>

      <section aria-labelledby="comics-heading" className="mt-8">
        <h2 id="comics-heading" className="font-semibold">
          En tu biblioteca
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {character.comics.map(({ comic, status }) => (
            <li key={comic.id} className="flex flex-col gap-1">
              <ComicCard comic={comic} />
              <p className="text-xs font-medium opacity-80">{READING_STATUS_LABELS[status]}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
