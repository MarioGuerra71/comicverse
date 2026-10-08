import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { formatDate, pluralize } from "@/lib/format";
import { buildCatalogHref } from "@/lib/catalog-url";
import { requireUser } from "@/server/auth/session";
import { getComicDetail } from "@/server/services/catalog";
import { getLibraryEntry, getReview } from "@/server/services/library";
import { LibraryControls } from "@/components/library/library-controls";

// cache: la página y su título comparten una sola consulta por petición.
const loadComic = cache(async (id: string) =>
  z.uuid().safeParse(id).success ? getComicDetail(db, id) : null,
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const comic = await loadComic((await params).id);
  return { title: comic ? `${comic.title} · ComicVerse` : "ComicVerse" };
}

export default async function ComicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [comic, entry, review] = await Promise.all([
    loadComic(id),
    getLibraryEntry(db, user.id, id),
    getReview(db, user.id, id),
  ]);
  if (!comic) notFound();

  const seriesLabel = comic.series.startYear
    ? `${comic.series.name} (${comic.series.startYear})`
    : comic.series.name;
  const releaseDate = formatDate(comic.releaseDate);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/catalog" className="text-sm text-ink underline">
        ← Volver al catálogo
      </Link>

      <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="relative aspect-2/3 w-full max-w-64 overflow-hidden border-2 border-ink bg-sheet">
          {comic.coverUrl ? (
            <Image
              src={comic.coverUrl}
              alt={`Portada de ${comic.title}`}
              fill
              unoptimized
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">
              Sin portada
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{comic.title}</h1>
            {comic.storyTitle && (
              <p className="mt-1 text-sm text-ink-soft">{comic.storyTitle}</p>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y-2 border-ink py-2 text-sm text-ink">
            <dt className="text-ink-soft">Editorial</dt>
            <dd>{comic.publisher}</dd>
            <dt className="text-ink-soft">Serie</dt>
            <dd>
              <Link
                href={buildCatalogHref({ seriesId: comic.series.id })}
                className="underline"
              >
                {seriesLabel}
              </Link>
            </dd>
            {releaseDate && (
              <>
                <dt className="text-ink-soft">Fecha</dt>
                <dd>{releaseDate}</dd>
              </>
            )}
          </dl>

          <LibraryControls comicId={comic.id} entry={entry} review={review} />

          <section aria-labelledby="characters-heading">
            <h2 id="characters-heading" className="text-lg font-extrabold text-ink">
              {entry?.status === "READ" ? "Personajes" : "Personajes que descubrirás"}
            </h2>
            {comic.characterCount > 0 && entry?.status === "READ" ? (
              <p className="mt-1 text-sm text-ink-soft">
                Ya leído: {comic.characterCount === 1 ? "su personaje está entintado" : "sus personajes están entintados"} en{" "}
                <Link href="/collection" className="text-ink underline">
                  tu colección
                </Link>
                .
              </p>
            ) : comic.characterCount > 0 ? (
              <p className="mt-1 text-sm text-ink-soft">
                Este cómic contiene{" "}
                {pluralize(comic.characterCount, "personaje", "personajes")} por
                descubrir. Se desbloquearán al marcarlo como leído.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">
                Este cómic no incluye ningún personaje coleccionable, así que
                leerlo no desbloqueará nada.
              </p>
            )}
          </section>
        </div>
      </div>

      {comic.description && (
        <section aria-labelledby="description-heading" className="mt-8">
          <h2 id="description-heading" className="text-lg font-extrabold text-ink">
            Descripción
          </h2>
          <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-ink">
            {comic.description}
          </p>
        </section>
      )}
    </main>
  );
}