import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 px-6 py-3">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-base font-bold">
            ComicVerse
          </Link>
          <Link href="/catalog" className="underline-offset-4 hover:underline">
            Catálogo
          </Link>
          <Link href="/library" className="underline-offset-4 hover:underline">
            Biblioteca
          </Link>
          <Link href="/collection" className="underline-offset-4 hover:underline">
            Colección
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/profile" className="underline-offset-4 hover:underline">
            {user.name}
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-foreground/10 px-6 py-4 text-xs opacity-70">
        Datos e imágenes de cómics proporcionados por{" "}
        <a
          href="https://comicvine.gamespot.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Comic Vine
        </a>
        . Proyecto personal sin ánimo de lucro.
      </footer>
    </div>
  );
}