import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BottomNav, SidebarNav } from "@/components/layout/app-nav";
import { ZoneSwitch } from "@/components/layout/zone-switch";
import { PanelMark } from "@/components/ui/icons";
import type { Zone } from "@/lib/zones";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex min-h-11 items-center gap-2 text-white"
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
export function AppShell({
  userName,
  zone,
  children,
}: {
  userName: string;
  zone: Zone;
  children: React.ReactNode;
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    // data-publisher cambia el color de la editorial en toda la zona (ver globals.css).
    <div data-publisher={zone} className="min-h-screen md:pl-20 lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-r-2 border-ink bg-sheet bg-brand-fade-y py-4 md:flex lg:w-60">
        <div className="flex justify-center px-3 lg:justify-start lg:px-5">
          <Brand compact />
        </div>
        {/* En el carril de la tablet no cabe: allí se cambia desde el catálogo. */}
        <ZoneSwitch zone={zone} className="mx-3 mt-5 hidden lg:flex" />
        <div className="mt-6 flex-1">
          <SidebarNav />
        </div>
        <div className="flex flex-col gap-1 border-t-2 border-ink px-3 pt-3">
          <Link
            href="/profile"
            title="Perfil"
            className="flex min-h-11 items-center justify-center gap-3 border-2 border-transparent px-3 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink lg:justify-start"
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

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b-2 border-ink bg-brand px-4 md:hidden">
        <Brand />
        <ZoneSwitch zone={zone} className="ml-auto mr-2" />
        {/* Fundido a blanco solo detrás del avatar: el texto blanco queda sobre color pleno. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-16 bg-linear-to-r from-brand to-sheet"
        />
        <Link
          href="/profile"
          aria-label={`Perfil de ${userName}`}
          className="relative flex h-11 w-11 items-center justify-center"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink text-sm font-bold text-ink">
            {initial}
          </span>
        </Link>
      </header>

      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        {/* En el móvil el relleno inferior deja sitio a la barra de pestañas fija. */}
        <footer className="border-t-2 border-ink bg-sheet px-6 pt-4 pb-24 text-xs text-ink-soft md:pb-4">
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
