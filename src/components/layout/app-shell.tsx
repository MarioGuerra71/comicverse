import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BottomNav, SidebarNav } from "@/components/layout/app-nav";
import { ZoneSwitch } from "@/components/layout/zone-switch";
import { PanelMark } from "@/components/ui/icons";
import type { Zone } from "@/lib/zones";

/** El letrero de la tienda: «ComicVerse» en neón del color de la editorial. */
function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex min-h-11 items-center gap-2" aria-label="ComicVerse, ir al inicio">
      <PanelMark size={22} className="text-editor drop-shadow-[0_0_8px_var(--glow)]" />
      <span
        className={`neon font-display text-2xl leading-none font-black tracking-wide uppercase ${
          compact ? "sr-only lg:not-sr-only" : ""
        }`}
      >
        ComicVerse
      </span>
    </Link>
  );
}

/**
 * La tienda de noche: suelo oscuro con el resplandor de la editorial filtrándose desde arriba,
 * barra lateral de cristal ahumado con el letrero de neón.
 * Móvil: barra superior de cristal + barra inferior. Tablet: carril de iconos. Escritorio: barra lateral.
 */
export function AppShell({
  userName,
  zone,
  isDemo = false,
  children,
}: {
  userName: string;
  zone: Zone;
  /** Cuenta de demo: aviso de que caduca y enlace para crear una de verdad. */
  isDemo?: boolean;
  children: React.ReactNode;
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    // data-publisher cambia el neón de la editorial en toda la zona (ver globals.css).
    <div data-publisher={zone} className="relative min-h-screen md:pl-20 lg:pl-64">
      {/* Resplandor del letrero sobre el suelo (decorativo, fijo detrás de todo). */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[60vh] bg-[radial-gradient(ellipse_70%_60%_at_60%_-10%,var(--glow),transparent_70%)] opacity-60"
      />

      <aside className="glass fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-r border-edge py-5 md:flex lg:w-64">
        <div className="flex justify-center px-3 lg:justify-start lg:px-6">
          <Brand compact />
        </div>
        <ZoneSwitch zone={zone} className="mx-4 mt-6 hidden lg:flex" />
        <ZoneSwitch zone={zone} compact className="mx-auto mt-4 w-12 lg:hidden" />
        <div className="mt-6 flex-1">
          <SidebarNav />
        </div>
        <div className="flex flex-col gap-1 border-t border-edge px-3 pt-3">
          <Link
            href="/profile"
            title="Perfil"
            className="flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm text-ink-soft transition-colors hover:bg-sheet-raised hover:text-ink lg:justify-start"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sheet-raised text-xs font-bold text-ink ring-1 ring-edge"
            >
              {initial}
            </span>
            <span className="sr-only lg:not-sr-only lg:truncate">{userName}</span>
          </Link>
          <SignOutButton className="justify-center rounded-xl lg:justify-start" />
        </div>
      </aside>

      <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between border-b border-edge px-4 md:hidden">
        <Brand />
        <ZoneSwitch zone={zone} className="mr-2 ml-auto" />
        <Link href="/profile" aria-label={`Perfil de ${userName}`} className="flex h-11 w-11 items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sheet-raised text-sm font-bold text-ink ring-1 ring-edge">
            {initial}
          </span>
        </Link>
      </header>

      <div className="relative flex min-h-screen flex-col">
        {isDemo && (
          <p className="border-b border-edge px-6 py-2 text-center text-xs text-ink-soft">
            Estás en la demo: esta cuenta y lo que hagas en ella se borran en 24 h.{" "}
            <Link href="/sign-up" className="text-ink underline">
              Crear mi cuenta
            </Link>
          </p>
        )}
        <div className="flex-1">{children}</div>
        {/* En el móvil el relleno inferior deja sitio a la barra de pestañas fija. */}
        <footer className="border-t border-edge px-6 pt-4 pb-24 text-xs text-ink-soft md:pb-4">
          Datos e imágenes de cómics proporcionados por{" "}
          <a href="https://comicvine.gamespot.com" target="_blank" rel="noopener noreferrer" className="text-ink underline">
            Comic Vine
          </a>
          . Proyecto personal sin ánimo de lucro.
        </footer>
      </div>

      <BottomNav />
    </div>
  );
}
