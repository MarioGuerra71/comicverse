import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, pluralize } from "@/lib/format";
import { ZONES } from "@/lib/zones";
import { FollowButton } from "@/components/social/follow-button";
import { PageHeader, SectionHeading } from "@/components/ui/page-parts";
import { RatingStarIcon } from "@/components/ui/icons";
import { requireUser } from "@/server/auth/session";
import { getPublicProfile, type ComparedAlbumDto } from "@/server/services/social";
import { handleSchema } from "@/server/validation/social";

const pad = (n: number) => String(n).padStart(3, "0");

// Privado o inexistente: el mismo 404 (no revela si el usuario existe).
const loadProfile = cache(async (handle: string) => {
  const parsed = handleSchema.safeParse(handle);
  if (!parsed.success) return null;
  const viewer = await requireUser();
  return getPublicProfile(db, viewer.id, parsed.data);
});

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const profile = await loadProfile((await params).handle);
  return { title: profile ? `${profile.user.name} · ComicVerse` : "ComicVerse" };
}

/** Un álbum del otro lector: portada, su progreso y, si tú también lo tienes, la comparación en cifras. */
function ComparedAlbum({ album, name }: { album: ComparedAlbumDto; name: string }) {
  const percent = album.total ? Math.round((album.theirs / album.total) * 100) : 0;
  return (
    <li className="flex gap-3 rounded-2xl border border-edge bg-sheet p-3">
      <span className="relative aspect-2/3 w-16 shrink-0 overflow-hidden rounded-lg border border-edge bg-paper">
        {album.coverThumbUrl && (
          <Image src={album.coverThumbUrl} alt="" fill unoptimized sizes="64px" className="object-cover" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="leading-tight font-bold text-ink">{album.title}</p>
        {album.total === 0 ? (
          <p className="mt-1 text-xs text-ink-soft">Sin personajes todavía.</p>
        ) : (
          <>
            <p className="mt-1 font-display text-xl leading-none font-extrabold text-ink">
              {pad(album.theirs)}
              <span className="text-base text-ink-soft">/{pad(album.total)}</span>
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sheet-raised" aria-hidden="true">
              <div className="h-full rounded-full bg-editor shadow-[0_0_10px_var(--glow)]" style={{ width: `${percent}%` }} />
            </div>
          </>
        )}
        {album.mine !== null && album.total > 0 && (
          <p className="mt-2 text-xs text-ink-soft">
            Tú: {album.mine} ·{" "}
            {album.ahead! > 0 ? (
              // Solo cuántos: quiénes son se descubre leyendo.
              <span className="font-hand text-base font-bold text-editor-ink">
                {name} te lleva {album.ahead} por descubrir
              </span>
            ) : album.behind! > 0 ? (
              <span className="font-hand text-base font-bold text-editor-ink">le llevas {album.behind}</span>
            ) : (
              "vais iguales"
            )}
          </p>
        )}
      </div>
    </li>
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const profile = await loadProfile((await params).handle);
  if (!profile) notFound();
  const { user, isMe, isFollowing, followers, shelves, activity, reviews } = profile;
  const albumCount = shelves.reduce((n, s) => n + s.albums.length, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/community" className="inline-flex min-h-11 items-center text-sm text-ink underline">
        ← Comunidad
      </Link>
      <div className="mt-2">
        <PageHeader title={user.name} figure={pad(albumCount)} figureLabel={albumCount === 1 ? "álbum" : "álbumes"}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
            <p className="text-xs text-ink-soft">
              /u/{user.handle} · {pluralize(followers, "seguidor", "seguidores")}
              {isMe && !user.isPublic && " · tu perfil es privado: solo lo ves tú"}
            </p>
            {isMe ? (
              <Link href="/profile" className="inline-flex min-h-11 items-center text-sm text-ink underline">
                Editar mi perfil
              </Link>
            ) : (
              <FollowButton handle={user.handle} following={isFollowing} />
            )}
          </div>
        </PageHeader>
      </div>

      {shelves
        .filter((s) => s.albums.length > 0)
        .map((shelf) => (
          // Cada estantería con el color de su editorial.
          <section key={shelf.zone} data-publisher={shelf.zone} aria-labelledby={`shelf-${shelf.zone}`} className="mt-10">
            <SectionHeading id={`shelf-${shelf.zone}`} title={`Álbumes de ${ZONES[shelf.zone].label}`} />
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shelf.albums.map((album) => (
                <ComparedAlbum key={album.seriesId} album={album} name={user.name} />
              ))}
            </ul>
          </section>
        ))}
      {albumCount === 0 && <p className="mt-8 text-sm text-ink-soft">Aún no tiene álbumes.</p>}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="activity">
          <SectionHeading id="activity" title="Últimas lecturas" />
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Todavía no ha leído ningún cómic.</p>
          ) : (
            <ol className="mt-2 text-sm">
              {activity.map((a) => (
                <li key={a.comic.id} className="flex items-baseline justify-between gap-4 border-b border-line py-2">
                  <Link href={`/comics/${a.comic.id}`} className="font-semibold text-ink underline">
                    {a.comic.title}
                  </Link>
                  {a.readAt && (
                    <span className="shrink-0 text-xs text-ink-soft">{formatDate(a.readAt.slice(0, 10))}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="reviews">
          <SectionHeading id="reviews" title="Reseñas" />
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No ha publicado reseñas.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {reviews.map((r) => (
                <li key={r.comic.id} className="rounded-2xl border border-edge bg-sheet p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/comics/${r.comic.id}`} className="font-bold text-ink underline">
                      {r.comic.title}
                    </Link>
                    {r.rating !== null && (
                      <span className="flex shrink-0" role="img" aria-label={`${r.rating} de 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <RatingStarIcon key={n} size={14} filled={n <= r.rating!} className="text-ink" />
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-prose text-sm whitespace-pre-line text-ink">{r.body}</p>
                  <p className="mt-2 text-xs text-ink-soft">{formatDate(r.updatedAt.slice(0, 10))}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
