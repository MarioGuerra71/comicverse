"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CatalogIcon,
  CollectionIcon,
  CommunityIcon,
  HomeIcon,
  LibraryIcon,
  MoreIcon,
  TrophyIcon,
  UniverseIcon,
} from "@/components/ui/icons";

// Las secciones y qué rutas pertenecen a cada una (la ficha de un personaje es "Colección").
const SECTIONS = [
  { href: "/dashboard", label: "Inicio", Icon: HomeIcon, match: ["/dashboard", "/discoveries"] },
  { href: "/catalog", label: "Catálogo", Icon: CatalogIcon, match: ["/catalog", "/comics"] },
  { href: "/library", label: "Biblioteca", Icon: LibraryIcon, match: ["/library"] },
  { href: "/collection", label: "Colección", Icon: CollectionIcon, match: ["/collection", "/characters"] },
  { href: "/graph", label: "Universo", Icon: UniverseIcon, match: ["/graph"] },
  { href: "/achievements", label: "Logros", Icon: TrophyIcon, match: ["/achievements"] },
  { href: "/community", label: "Comunidad", Icon: CommunityIcon, match: ["/community", "/u"] },
] as const;

/** En el móvil caben 4 pestañas fijas; el resto va en «Más». */
const MOBILE_MAIN = 4;

function isActive(pathname: string, match: readonly string[]) {
  return match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Barra lateral: carril de iconos en tablet, iconos y texto en escritorio. */
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1 px-3">
      {SECTIONS.map(({ href, label, Icon, match }) => {
        const active = isActive(pathname, match);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            title={label}
            className={`flex min-h-11 items-center justify-center gap-3 border-2 px-3 text-sm transition-colors lg:justify-start ${
              // Sobre el color de la editorial: la sección activa es un recuadro de papel.
              active
                ? "border-white bg-sheet font-semibold text-editor-ink"
                : "border-transparent font-medium text-white hover:border-white"
            }`}
          >
            <Icon />
            <span className="sr-only lg:not-sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const tabClass = (active: boolean) =>
  `relative flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
    active ? "font-semibold text-editor-ink" : "text-ink-soft"
  }`;

/** Barra inferior del móvil: 4 pestañas y «Más» (Universo, Logros, Comunidad y Perfil). */
export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const extra = SECTIONS.slice(MOBILE_MAIN);
  const extraActive = extra.some((s) => isActive(pathname, s.match)) || isActive(pathname, ["/profile"]);

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-sheet pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {open && (
        <ul id="more-menu" className="absolute inset-x-0 bottom-full grid grid-cols-2 gap-2 border-t-2 border-ink bg-sheet p-3">
          {[...extra, { href: "/profile", label: "Perfil", Icon: HomeIcon, match: ["/profile"] }].map(
            ({ href, label, Icon, match }) => {
              const active = isActive(pathname, match);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center gap-3 border-2 px-3 text-sm font-semibold ${
                      active ? "border-ink bg-ink text-paper" : "border-ink bg-sheet text-ink"
                    }`}
                  >
                    {href === "/profile" ? <span aria-hidden="true" className="h-5 w-5 rounded-full border-2 border-current" /> : <Icon size={20} />}
                    {label}
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      )}
      <ul className="grid grid-cols-5">
        {SECTIONS.slice(0, MOBILE_MAIN).map(({ href, label, Icon, match }) => {
          const active = isActive(pathname, match);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
                {active && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 bg-editor" />}
                <Icon size={22} />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="more-menu"
            onClick={() => setOpen((v) => !v)}
            className={tabClass(extraActive || open)}
          >
            {extraActive && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 bg-editor" />}
            <MoreIcon size={22} />
            Más
          </button>
        </li>
      </ul>
    </nav>
  );
}
