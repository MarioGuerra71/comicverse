import Link from "next/link";
import { inkButton, outlineButton } from "@/components/ui/page-parts";
import { PanelMark } from "@/components/ui/icons";
import { getSession } from "@/server/auth/session";

/** Una tira de tres viñetas: una entintada y dos aún a lápiz azul (sin spoilers: no hay imágenes). */
function PencilStrip() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-3">
      <div className="flex aspect-3/4 items-end border-2 border-ink bg-ink p-2">
        <span className="font-hand text-2xl leading-none font-bold text-paper">001</span>
      </div>
      {[2, 3].map((n) => (
        <div key={n} className="relative aspect-3/4 border-[1.5px] border-blue bg-sheet">
          <svg viewBox="0 0 30 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-blue">
            <path d="M0 0 30 40M30 0 0 40" stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="absolute bottom-2 left-2 font-hand text-2xl leading-none font-bold text-blue-ink">
            00{n}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-10">
      <p className="inline-flex items-center gap-2 text-xl font-extrabold text-ink">
        <PanelMark size={24} />
        ComicVerse
      </p>
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Tu universo está a lápiz.
        </h1>
        <p className="mt-3 max-w-prose text-lg text-ink-soft">
          Cada cómic que lees entinta a sus personajes y las relaciones entre ellos.
        </p>
      </div>
      <PencilStrip />
      <div className="flex flex-wrap gap-3">
        {session ? (
          <Link href="/dashboard" className={inkButton}>
            Ir a mi universo
          </Link>
        ) : (
          <>
            <Link href="/sign-up" className={inkButton}>
              Crear cuenta
            </Link>
            <Link href="/sign-in" className={outlineButton}>
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
