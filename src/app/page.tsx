import Link from "next/link";
import { inkButton, outlineButton } from "@/components/ui/page-parts";
import { PanelMark } from "@/components/ui/icons";
import { getSession } from "@/server/auth/session";

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
