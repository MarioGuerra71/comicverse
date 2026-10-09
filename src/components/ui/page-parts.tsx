import Link from "next/link";

// Piezas comunes del sistema "Página de arte original" (ver DESIGN.md).

/** Pestaña entintada: relleno de tinta = seleccionada (igual que la navegación). */
export const inkTab = (active: boolean) =>
  `flex min-h-11 items-center border-2 border-ink px-3 text-sm font-semibold transition-colors ${
    active ? "bg-ink text-paper" : "bg-sheet text-ink hover:bg-sheet-raised"
  }`;

/** Botón principal: tinta llena. */
export const inkButton =
  "inline-flex min-h-11 items-center justify-center gap-2 border-2 border-ink bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink/85 disabled:opacity-50";

/** Botón secundario: recuadro entintado sobre papel. */
export const outlineButton =
  "inline-flex min-h-11 items-center justify-center gap-2 border-2 border-ink bg-sheet px-4 text-sm font-semibold text-ink transition-colors hover:bg-sheet-raised disabled:opacity-50";

/** Enlace discreto (ordenación, cambios de vista): activo subrayado en el color del editor. */
export const quietLink = (active: boolean) =>
  `flex min-h-11 items-center px-2 text-sm underline-offset-[6px] transition-colors ${
    active ? "font-semibold text-ink underline decoration-editor decoration-2" : "text-ink-soft hover:text-ink"
  }`;

/** Campo de texto o desplegable sobre papel, con filete de tinta. */
export const inkField =
  "min-h-11 border-2 border-ink bg-sheet px-3 text-sm text-ink placeholder:text-ink-soft";

/**
 * Cajetín de la página, como el que traen impreso las páginas de arte original:
 * título a la izquierda, una cifra escrita a mano a la derecha y, debajo, una fila
 * opcional de casillas o una línea de texto.
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
    <header className="border-2 border-ink bg-sheet">
      <div className="grid grid-cols-[1fr_auto]">
        {/* Rojo pleno bajo el título; el fundido a blanco va en una banda propia a la derecha
            que el texto nunca pisa (si no, un título largo quedaría blanco sobre blanco). */}
        <div className="relative flex min-w-0 items-center bg-brand py-3 pr-10 pl-4 md:pr-[40%]">
          <h1 className="text-xl font-extrabold tracking-tight text-balance break-words text-white sm:text-3xl md:text-4xl">
            {title}
          </h1>
          <span
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-8 bg-linear-to-r from-brand to-sheet md:w-[38%]"
          />
        </div>
        {figure !== undefined && (
          <div className="border-l-2 border-ink px-4 py-2 text-right whitespace-nowrap">
            <p className="font-hand text-4xl leading-none font-bold text-ink">{figure}</p>
            {figureLabel && <p className="text-xs text-ink-soft">{figureLabel}</p>}
          </div>
        )}
      </div>
      {children && <div className="border-t-2 border-ink">{children}</div>}
    </header>
  );
}

/** Casilla del cajetín: cifra a mano y su etiqueta; enlaza a su pantalla. */
export function HeaderField({
  href,
  value,
  total,
  label,
}: {
  href: string;
  value: number;
  total?: number;
  label: string;
}) {
  return (
    <Link href={href} className="flex flex-col bg-sheet px-4 py-2 transition-colors hover:bg-sheet-raised">
      <span className="font-hand text-3xl leading-none font-bold text-ink">
        {value}
        {total !== undefined && <span className="text-xl text-ink-soft">/{total}</span>}
      </span>
      <span className="text-xs text-ink-soft">{label}</span>
    </Link>
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
    <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-1">
      <h2 id={id} className="text-xl font-extrabold tracking-tight text-ink">
        {title}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm whitespace-nowrap text-ink underline">
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
      className="mt-8 flex items-center justify-between border-t-2 border-ink pt-2 text-sm"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="flex min-h-11 items-center text-ink underline">
          ← Anterior
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <span className="text-ink-soft">
        Página <span className="font-hand text-xl font-bold text-ink">{page}</span> de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="flex min-h-11 items-center text-ink underline">
          Siguiente →
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
    <div className="mt-3 flex h-8 items-center border-2 border-ink bg-brand-fade-x px-3" aria-label={`Editorial: ${name}`}>
      <span className="text-xs font-extrabold tracking-wide text-white uppercase">{name}</span>
    </div>
  );
}
