import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { AlbumBinder } from "@/components/collection/album-binder";
import { MarkCollectionSeen } from "@/components/collection/mark-seen";
import { PageHeader } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getAlbum } from "@/server/services/discovery";

const pad = (n: number) => String(n).padStart(3, "0");

// La página y su título comparten la consulta. null = serie inexistente o que no tienes.
const loadAlbum = cache(async (seriesId: string) => {
  if (!z.uuid().safeParse(seriesId).success) return null;
  const user = await requireUser();
  return getAlbum(db, user.id, seriesId);
});

export async function generateMetadata({ params }: { params: Promise<{ seriesId: string }> }): Promise<Metadata> {
  const data = await loadAlbum((await params).seriesId);
  return { title: data ? `${data.album.title} · Mi colección · ComicVerse` : "ComicVerse" };
}

export default async function AlbumPage({ params }: { params: Promise<{ seriesId: string }> }) {
  const data = await loadAlbum((await params).seriesId);
  if (!data) notFound();
  const { album, zone } = data;
  const percent = album.total ? Math.round((album.discovered / album.total) * 100) : 0;
  const hasNew = album.slots.some((s) => s.kind === "card" && s.card.isNew);

  return (
    // El álbum se pinta con el color de su editorial, aunque estés en la otra zona.
    <main data-publisher={zone ?? undefined} className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/collection" className="inline-flex min-h-11 items-center text-sm text-ink underline">
        ← Mi colección
      </Link>
      <div className="mt-2">
        <PageHeader
          title={album.title}
          figure={
            <>
              {pad(album.discovered)}
              <span className="text-2xl text-ink-soft">/{pad(album.total)}</span>
            </>
          }
          figureLabel="personajes"
        >
          <div className="px-4 py-3">
            <div className="h-2 bg-sheet-raised" aria-hidden="true">
              <div className="h-full bg-ink" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              {percent} % completado ·{" "}
              {album.total - album.discovered === 0
                ? "¡álbum completo!"
                : `te faltan ${album.total - album.discovered}: lee más cómics de esta serie para entintarlos`}
            </p>
          </div>
        </PageHeader>
      </div>

      {album.total === 0 ? (
        <p className="mt-6 max-w-prose text-sm text-ink-soft">
          Sus personajes aparecerán cuando abras o leas alguno de sus cómics.
        </p>
      ) : (
        <AlbumBinder slots={album.slots} total={album.total} />
      )}
      {hasNew && <MarkCollectionSeen />}
    </main>
  );
}
