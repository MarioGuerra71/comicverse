"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CatalogIcon,
  CollectionIcon,
  HomeIcon,
  LibraryIcon,
  UniverseIcon,
} from "@/components/ui/icons";

// Las 5 secciones y qué rutas pertenecen a cada una (la ficha de un personaje es "Colección").
const SECTIONS = [
  { href: "/dashboard", label: "Inicio", Icon: HomeIcon, match: ["/dashboard", "/discoveries", "/profile", "/achievements"] },
  { href: "/catalog", label: "Catálogo", Icon: CatalogIcon, match: ["/catalog", "/comics"] },
  { href: "/library", label: "Biblioteca", Icon: LibraryIcon, match: ["/library"] },
  { href: "/collection", label: "Colección", Icon: CollectionIcon, match: ["/collection", "/characters"] },
  { href: "/graph", label: "Universo", Icon: UniverseIcon, match: ["/graph"] },
] as const;

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

/** Barra inferior del móvil: 5 pestañas con icono y texto; la activa, con el lápiz del editor. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-sheet pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {SECTIONS.map(({ href, label, Icon, match }) => {
          const active = isActive(pathname, match);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? "font-semibold text-editor-ink" : "text-ink-soft"
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 bg-editor"
                  />
                )}
                <Icon size={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
