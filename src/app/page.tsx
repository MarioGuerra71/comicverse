import Link from "next/link";
import { getSession } from "@/server/auth/session";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">ComicVerse</h1>
      <p className="text-lg opacity-80">
        Descubre el universo de los cómics mientras lo lees.
      </p>
      <div className="flex gap-3">
        {session ? (
          <Link
            href="/dashboard"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background"
          >
            Ir a mi universo
          </Link>
        ) : (
          <>
            <Link
              href="/sign-up"
              className="rounded-md bg-foreground px-4 py-2 font-medium text-background"
            >
              Crear cuenta
            </Link>
            <Link
              href="/sign-in"
              className="rounded-md border border-foreground/20 px-4 py-2"
            >
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </main>
  );
}