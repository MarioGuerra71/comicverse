import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";

// Piezas comunes del sistema «Tienda de cómics a medianoche» (ver DESIGN.md).

/** Pestaña: pastilla de cristal; la seleccionada se enciende con el neón de la editorial. */
export const inkTab = (active: boolean) =>
  `flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
    active
      ? "bg-editor/15 text-ink ring-1 ring-editor shadow-[0_0_18px_var(--glow)]"
      : "glass text-ink-soft ring-1 ring-edge hover:text-ink hover:bg-sheet-raised"
  }`;

/** Botón principal: luz de caja de luz (crema), con halo al pasar. */
export const inkButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition-all duration-200 hover:shadow-[0_0_24px_rgb(244_239_230/0.35)] active:scale-[0.98] disabled:opacity-50";

/** Botón secundario: cristal ahumado. */
export const outlineButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full glass px-5 text-sm font-semibold text-ink ring-1 ring-edge transition-colors hover:bg-sheet-raised disabled:opacity-50";

/** Enlace discreto (ordenación, cambios de vista): activo subrayado en neón. */
export const quietLink = (active: boolean) =>
  `flex min-h-11 items-center px-2 text-sm underline-offset-[6px] transition-colors ${
    active ? "font-semibold text-ink underline decoration-editor decoration-2" : "text-ink-soft hover:text-ink"
  }`;

/** Campo de texto o desplegable: cristal con filo de luz. */
export const inkField =
  "min-h-11 rounded-xl border border-edge bg-sheet px-4 text-sm text-ink placeholder:text-ink-soft focus:border-editor focus:outline-none";

/**
 * Cabecera de pantalla como el rótulo de una tienda de noche: título en letras de letrero y,
 * a la derecha, la cifra monumental en neón. Debajo, una barra de cristal opcional.
 */
export function PageHeader({
  title,
  figure,
  figureLabel,
  children,
}: {
  title: string;
  figure?: React.ReactNode;
  figureLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <header>
      <div className="flex items-end justify-between gap-4">
        <h1 className="min-w-0 font-display text-4xl leading-[0.9] font-extrabold tracking-tight text-balance break-words text-ink uppercase sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {figure !== undefined && (
          <div className="shrink-0 text-right">
            <p className="neon font-display text-5xl leading-none font-black md:text-6xl">{figure}</p>
            {figureLabel && <p className="mt-1 text-xs tracking-wide text-ink-soft uppercase">{figureLabel}</p>}
          </div>
        )}
      </div>
      {/* El filo de neón que separa el rótulo del contenido. */}
      <div aria-hidden="true" className="mt-4 h-px bg-linear-to-r from-editor via-editor/30 to-transparent" />
      {children && <div className="glass mt-4 overflow-hidden rounded-2xl ring-1 ring-edge">{children}</div>}
    </header>
  );
}

/** Título de sección con un enlace opcional a la derecha. */
export function SectionHeading({
  id,
  title,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-display text-2xl font-extrabold tracking-wide text-ink uppercase md:text-3xl">
        {title}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm whitespace-nowrap text-ink-soft transition-colors hover:text-editor">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Paginación anterior/siguiente; `hrefFor` construye el enlace de cada página. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Paginación"
      className="mt-8 flex items-center justify-between text-sm"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="flex min-h-11 items-center gap-2 rounded-full glass px-4 text-ink ring-1 ring-edge hover:bg-sheet-raised">
          <ArrowIcon direction="left" size={16} />
          Anterior
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <span className="text-ink-soft">
        Página <span className="font-display text-xl font-extrabold text-ink">{page}</span> de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="flex min-h-11 items-center gap-2 rounded-full glass px-4 text-ink ring-1 ring-edge hover:bg-sheet-raised">
          Siguiente
          <ArrowIcon size={16} />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}

/** Franja de la editorial en las fichas (rojo Marvel, azul DC): dice «de qué universo es esto». */
export function PublisherStrip({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <div className="mt-3 inline-flex h-8 items-center gap-2 rounded-full glass px-3 ring-1 ring-edge" aria-label={`Editorial: ${name}`}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-editor shadow-[0_0_10px_var(--glow)]" />
      <span className="text-xs font-bold tracking-widest text-ink uppercase">{name}</span>
    </div>
  );
}

/** Enlace para volver a la pantalla anterior: pastilla de cristal con flecha. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-ink-soft ring-1 ring-edge transition-colors hover:text-ink"
    >
      <ArrowIcon direction="left" size={16} />
      {children}
    </Link>
  );
}

/** Control segmentado: varias opciones en una sola cápsula; la activa, rellena sin neón. */
export const segmentGroup = "inline-flex shrink-0 rounded-full bg-sheet p-1 ring-1 ring-edge";
export const segment = (active: boolean) =>
  `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors ${
    active ? "bg-sheet-raised font-semibold text-ink ring-1 ring-edge" : "text-ink-soft hover:text-ink"
  }`;
