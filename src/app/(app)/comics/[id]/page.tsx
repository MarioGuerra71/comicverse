import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { formatDate, pluralize } from "@/lib/format";
import { buildCatalogHref } from "@/lib/catalog-url";
import { requireUser } from "@/server/auth/session";
import { getComicDetail } from "@/server/services/catalog";
import { getLibraryEntry } from "@/server/services/library";
import { LibraryControls } from "@/components/library/library-controls";

export default async function ComicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [comic, entry] = await Promise.all([
    getComicDetail(db, id),
    getLibraryEntry(db, user.id, id),
  ]);
  if (!comic) notFound();

  const seriesLabel = comic.series.startYear
    ? `${comic.series.name} (${comic.series.startYear})`
    : comic.series.name;
  const releaseDate = formatDate(comic.releaseDate);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/catalog" className="text-sm underline">
        ← Volver al catálogo
      </Link>

      <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="relative aspect-2/3 w-full max-w-64 overflow-hidden rounded-md bg-foreground/10">
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
            <div className="flex h-full items-center justify-center text-sm opacity-60">
              Sin portada
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">{comic.title}</h1>
            {comic.storyTitle && (
              <p className="mt-1 text-sm opacity-70">{comic.storyTitle}</p>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="opacity-60">Editorial</dt>
            <dd>{comic.publisher}</dd>
            <dt className="opacity-60">Serie</dt>
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
                <dt className="opacity-60">Fecha</dt>
                <dd>{releaseDate}</dd>
              </>
            )}
          </dl>

          <LibraryControls comicId={comic.id} entry={entry} />

          <section aria-labelledby="characters-heading">
            <h2 id="characters-heading" className="font-semibold">
              Personajes que descubrirás
            </h2>
            {comic.characterCount > 0 ? (
              <p className="mt-1 text-sm opacity-80">
                Este cómic contiene{" "}
                {pluralize(comic.characterCount, "personaje", "personajes")} por
                descubrir. Se desbloquearán al marcarlo como leído.
              </p>
            ) : (
              <p className="mt-1 text-sm opacity-80">
                Este cómic no incluye ningún personaje coleccionable, así que
                leerlo no desbloqueará nada.
              </p>
            )}
          </section>
        </div>
      </div>

      {comic.description && (
        <section aria-labelledby="description-heading" className="mt-8">
          <h2 id="description-heading" className="font-semibold">
            Descripción
          </h2>
          <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed opacity-90">
            {comic.description}
          </p>
        </section>
      )}
    </main>
  );
}