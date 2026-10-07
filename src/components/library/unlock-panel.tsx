import Image from "next/image";
import Link from "next/link";

// Forma del `unlock` que devuelve la API (copia local: el cliente no importa src/server).
export interface UnlockView {
  newCharacters: { id: string; name: string; imageThumbUrl: string | null }[];
  lostCharacters: { id: string; name: string }[];
  newRelationships: number;
  progress: { unlocked: number; total: number };
}

export function UnlockPanel({ unlock, onClose }: { unlock: UnlockView; onClose: () => void }) {
  const gained = unlock.newCharacters.length;
  const lost = unlock.lostCharacters.length;
  const progress = `${unlock.progress.unlocked} / ${unlock.progress.total} personajes descubiertos`;

  return (
    <div
      role="status"
      className="border-2 border-ink bg-sheet p-4 motion-safe:animate-pop-in"
    >
      {gained > 0 ? (
        <>
          <p className="font-hand text-2xl leading-none font-bold text-editor-ink">¡entintado!</p>
          <p className="mt-1 text-lg font-extrabold text-ink">
            {gained === 1 ? "1 nuevo descubrimiento" : `${gained} nuevos descubrimientos`}
          </p>
          {unlock.newRelationships > 0 && (
            <p className="text-sm text-ink-soft">
              {unlock.newRelationships === 1
                ? "y 1 relación nueva entre personajes"
                : `y ${unlock.newRelationships} relaciones nuevas entre personajes`}
            </p>
          )}
          <ul className="mt-3 flex flex-wrap gap-3">
            {unlock.newCharacters.map((character, index) => (
              <li
                key={character.id}
                className="motion-safe:animate-pop-in"
                style={{ animationDelay: `${200 + index * 120}ms` }}
              >
                <Link
                  href={`/characters/${character.id}`}
                  className="flex w-20 flex-col gap-1 text-xs text-ink"
                >
                  <span className="relative block aspect-3/4 w-full overflow-hidden border-2 border-ink bg-sheet">
                    {character.imageThumbUrl && (
                      <Image
                        src={character.imageThumbUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="leading-tight font-bold">{character.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : lost > 0 ? (
        <p className="text-sm text-ink">
          {lost === 1
            ? `${unlock.lostCharacters[0].name} vuelve a estar por descubrir.`
            : `${lost} personajes vuelven a estar por descubrir.`}
        </p>
      ) : (
        <p className="text-sm text-ink">Leído. Este cómic no te ha descubierto personajes nuevos.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href="/collection" className="text-ink underline">
          {progress}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 px-2 text-ink underline underline-offset-4"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
