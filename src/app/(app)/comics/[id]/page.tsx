import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { zoneOfPublisher } from "@/lib/zones";
import { BackLink, PublisherStrip, SectionHeading } from "@/components/ui/page-parts";
import { RatingStarIcon } from "@/components/ui/icons";
import { db } from "@/lib/db";
import { formatDate, pluralize } from "@/lib/format";
import { buildCatalogHref } from "@/lib/catalog-url";
import { requireUser } from "@/server/auth/session";
import { getComicDetail } from "@/server/services/catalog";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { ensureComicCharacters } from "@/server/jobs/sync-comic-characters";
import { findUnreadUpTo, getLibraryEntry, getReview } from "@/server/services/library";
import { getComicCommunity, type ComicCommunityDto } from "@/server/services/social";
import { READING_STATUS_LABELS } from "@/lib/reading-status";
import { LibraryControls } from "@/components/library/library-controls";

// cache: la página y su título comparten una sola consulta por petición.
// La primera vez que se abre un cómic se traen sus personajes de Comic Vine (una petición).
const loadComic = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) return null;
  await ensureComicCharacters(db, getComicVineClient(), id);
  return getComicDetail(db, id);
});

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

  const [comic, entry, review, community] = await Promise.all([
    loadComic(id),
    getLibraryEntry(db, user.id, id),
    getReview(db, user.id, id),
    getComicCommunity(db, id, user.id),
  ]);
  if (!comic) notFound();
  // Anteriores de la serie sin leer (sin contar este): para «marcar también los anteriores».
  const unreadUpTo = await findUnreadUpTo(db, user.id, id);
  const earlierUnread = unreadUpTo.filter((comicId) => comicId !== id).length;

  const seriesLabel = comic.series.startYear
    ? `${comic.series.name} (${comic.series.startYear})`
    : comic.series.name;
  const releaseDate = formatDate(comic.releaseDate);

  return (
    // Con el color de su editorial (rojo Marvel, azul DC) aunque estés en la otra zona.
    <main
      data-publisher={zoneOfPublisher(comic.publisher) ?? undefined}
      className="relative isolate mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8"
    >
      {/* La portada ilumina la parte de arriba de la página (decorativo). */}
      {comic.coverUrl && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden">
          <Image src={comic.coverUrl} alt="" fill unoptimized className="scale-110 object-cover opacity-30 blur-3xl saturate-150" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-paper/60 to-paper" />
        </div>
      )}

      <BackLink href="/catalog">Catálogo</BackLink>

      <header className="mt-6 grid items-end gap-8 sm:grid-cols-[minmax(0,15rem)_1fr] md:gap-12">
        <div className="lightbox-item mx-auto w-52 sm:w-full">
          <div className="lightbox-cover relative aspect-2/3 overflow-hidden rounded-lg bg-sheet ring-1 ring-white/25">
            {comic.coverUrl ? (
              <Image src={comic.coverUrl} alt={`Portada de ${comic.title}`} fill unoptimized priority className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-soft">Sin portada</div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PublisherStrip name={comic.publisher} />
            {entry && (
              <span className="mt-3 inline-flex h-8 items-center rounded-full bg-editor/15 px-3 text-xs font-bold tracking-widest text-ink uppercase ring-1 ring-editor">
                {READING_STATUS_LABELS[entry.status]}
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-5xl leading-[0.9] font-black tracking-tight text-balance text-ink uppercase md:text-7xl">
            {comic.title}
          </h1>
          {comic.storyTitle && <p className="mt-3 text-lg text-ink-soft">{comic.storyTitle}</p>}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-xs tracking-wide text-ink-soft uppercase">Serie</dt>
              <dd className="mt-0.5">
                <Link href={buildCatalogHref({ seriesId: comic.series.id })} className="font-semibold text-ink underline-offset-4 hover:underline">
                  {seriesLabel}
                </Link>
              </dd>
            </div>
            {releaseDate && (
              <div>
                <dt className="text-xs tracking-wide text-ink-soft uppercase">Publicado</dt>
                <dd className="mt-0.5 font-semibold text-ink">{releaseDate}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs tracking-wide text-ink-soft uppercase">Lectores</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-ink">
                {community.readers === 0 ? (
                  "Sé el primero"
                ) : (
                  <>
                    {pluralize(community.readers, "lector", "lectores")}
                    {community.averageRating !== null && (
                      <>
                        <span className="text-ink-soft">·</span>
                        <RatingStarIcon size={16} filled className="text-editor" />
                        {community.averageRating.toLocaleString("es-ES")}
                      </>
                    )}
                  </>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* En el móvil, «Tu lectura» va primero: es lo que vienes a hacer. */}
        <div className="lg:sticky lg:top-6 lg:order-2 lg:self-start">
          <LibraryControls comicId={comic.id} entry={entry} review={review} earlierUnread={earlierUnread} />
        </div>

        <div className="flex min-w-0 flex-col gap-10 lg:order-1">
          <section aria-labelledby="characters-heading" className="glass rounded-3xl p-5 ring-1 ring-edge">
            <h2 id="characters-heading" className="font-display text-2xl font-extrabold tracking-wide text-ink uppercase">
              {entry?.status === "READ" ? "Su reparto" : "Personajes que descubrirás"}
            </h2>
            {comic.characterCount > 0 ? (
              <p className="mt-2 flex items-baseline gap-3 text-sm text-ink-soft">
                <span className="neon font-display text-5xl leading-none font-black">{comic.characterCount}</span>
                {entry?.status === "READ" ? (
                  <span>
                    {comic.characterCount === 1 ? "personaje encendido" : "personajes encendidos"} en{" "}
                    <Link href="/collection" className="text-ink underline">
                      tu colección
                    </Link>
                    .
                  </span>
                ) : (
                  // Solo el número: de un personaje sin descubrir no viaja nada más.
                  <span>
                    {comic.characterCount === 1 ? "personaje por descubrir" : "personajes por descubrir"}. Se
                    desbloquean al marcarlo como leído.
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                Este cómic no incluye ningún personaje coleccionable, así que leerlo no desbloqueará nada.
              </p>
            )}
          </section>

          {comic.description && (
            <section aria-labelledby="description-heading">
              <SectionHeading id="description-heading" title="De qué va" />
              <p className="mt-3 max-w-prose text-base leading-relaxed whitespace-pre-line text-ink">
                {comic.description}
              </p>
            </section>
          )}

          <CommunityReviews community={community} />
        </div>
      </div>
    </main>
  );
}

/** Reseñas públicas de otros lectores, como en Letterboxd: autor, estrellas y texto. */
function CommunityReviews({ community }: { community: ComicCommunityDto }) {
  return (
    <section aria-labelledby="reviews-heading">
      <SectionHeading id="reviews-heading" title="Reseñas de lectores" />
      {community.reviews.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          Aún no hay reseñas públicas de otros lectores.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-edge">
          {community.reviews.map((r) => (
            <li key={r.author.handle} className="flex gap-4 py-5 first:pt-0">
              <Link
                href={`/u/${r.author.handle}`}
                aria-hidden="true"
                tabIndex={-1}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sheet-raised font-bold text-ink ring-1 ring-edge"
              >
                {r.author.name.trim().charAt(0).toUpperCase() || "?"}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href={`/u/${r.author.handle}`} className="font-semibold text-ink underline-offset-4 hover:underline">
                    {r.author.name}
                  </Link>
                  {r.rating !== null && (
                    <span className="flex" aria-label={`${r.rating} de 5`}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <RatingStarIcon key={v} size={14} filled={v <= r.rating!} className={v <= r.rating! ? "text-editor" : "text-ink-soft"} />
                      ))}
                    </span>
                  )}
                  <span className="text-xs text-ink-soft">{formatDate(r.updatedAt.slice(0, 10))}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink">{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
