import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { CharacterCard, LockedCard } from "@/components/characters/character-card";
import { requireUser } from "@/server/auth/session";
import { getCollection } from "@/server/services/discovery";

export const metadata: Metadata = { title: "Mi colección · ComicVerse" };

export default async function CollectionPage() {
  const user = await requireUser();
  const { cards, locked, progress, relationships } = await getCollection(db, user.id);
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

      {cards.length === 0 && (
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
