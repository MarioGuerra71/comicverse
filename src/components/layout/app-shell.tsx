import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BottomNav, SidebarNav } from "@/components/layout/app-nav";
import { PanelMark } from "@/components/ui/icons";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex min-h-11 items-center gap-2 text-ink"
      aria-label="ComicVerse, ir al inicio"
    >
      <PanelMark size={22} />
      <span
        className={`text-lg font-extrabold tracking-tight ${compact ? "sr-only lg:not-sr-only" : ""}`}
      >
        ComicVerse
      </span>
    </Link>
  );
}

/**
 * Estructura de la parte privada, como el borde de una página de arte original:
 * filetes de tinta separan las zonas y el lápiz del editor marca dónde estás.
 * Móvil: barra superior + barra inferior de 5 pestañas. Tablet: carril de iconos.
 * Escritorio: barra lateral con texto.
 */
export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen md:pl-20 lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-r-2 border-ink bg-sheet py-4 md:flex lg:w-60">
        <div className="flex justify-center px-3 lg:justify-start lg:px-5">
          <Brand compact />
        </div>
        <div className="mt-6 flex-1">
          <SidebarNav />
        </div>
        <div className="flex flex-col gap-1 border-t border-line px-3 pt-3">
          <Link
            href="/profile"
            title="Perfil"
            className="flex min-h-11 items-center justify-center gap-3 rounded-sm px-3 text-sm text-ink-soft transition-colors hover:bg-sheet-raised hover:text-ink lg:justify-start"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-bold text-ink"
            >
              {initial}
            </span>
            <span className="sr-only lg:not-sr-only lg:truncate">{userName}</span>
          </Link>
          <SignOutButton className="justify-center lg:justify-start" />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b-2 border-ink bg-sheet px-4 md:hidden">
        <Brand />
        <Link
          href="/profile"
          aria-label={`Perfil de ${userName}`}
          className="flex h-11 w-11 items-center justify-center"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink text-sm font-bold text-ink">
            {initial}
          </span>
        </Link>
      </header>

      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line bg-sheet px-6 py-4 text-xs text-ink-soft">
          Datos e imágenes de cómics proporcionados por{" "}
          <a
            href="https://comicvine.gamespot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline"
          >
            Comic Vine
          </a>
          . Proyecto personal sin ánimo de lucro.
        </footer>
      </div>

      <BottomNav />
    </div>
  );
}
