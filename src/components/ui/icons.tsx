// Iconos propios: trazo de 1,5 px sobre una rejilla de 24, extremos redondeados,
// en currentColor. Mismo trazo y peso en toda la app (nada de emojis ni Unicode).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Inicio: una hoja con la esquina doblada (sin viñetas, para no confundirse con la marca). */
export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
    </Svg>
  );
}

/** Catálogo: un cómic abierto. */
export function CatalogIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6.5C10.5 5.3 8 4.8 4 5v13c4-.2 6.5.3 8 1.5" />
      <path d="M12 6.5c1.5-1.2 4-1.7 8-1.5v13c-4-.2-6.5.3-8 1.5" />
      <path d="M12 6.5v13" />
    </Svg>
  );
}

/** Biblioteca: lomos en una balda. */
export function LibraryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 20h18" />
      <path d="M5 20V6h3v14" />
      <path d="M10 20V4h3v16" />
      <path d="m15.5 7.2 2.9-.8 3 12.8-2.9.8z" />
    </Svg>
  );
}

/** Colección: cartas apiladas. */
export function CollectionIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="7" y="3.5" width="12" height="16" rx="1.5" />
      <path d="M5 6.5v12a2 2 0 0 0 2 2h9" />
      <path d="m13 8.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" />
    </Svg>
  );
}

/** Universo: tres viñetas unidas, como personajes relacionados. */
export function UniverseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="8" width="7" height="7" />
      <rect x="6" y="15" width="7" height="6" />
      <path d="M10 6.5h6.5V8M9.5 15v-5" />
    </Svg>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M10 8 6 12l4 4" />
      <path d="M6 12h10" />
    </Svg>
  );
}


/** Favorito: corazón de trazo; `filled` lo rellena. */
export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20Z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

/** Puntuación: estrella de cinco puntas; `filled` la rellena. */
export function RatingStarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

/** Marca: dos viñetas entintadas separadas por la calle (gutter), como una página. */
export function PanelMark(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={2}>
      <rect x="3" y="3" width="10" height="18" />
      <path d="M16 3h5v8h-5zM16 14h5v7h-5z" />
    </Svg>
  );
}

/** Logros: una copa con asas sobre su peana. */
export function TrophyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5v1a3 3 0 0 0 3 3" />
      <path d="M16 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 13v4" />
      <path d="M8.5 20h7l-.8-3H9.3z" />
    </Svg>
  );
}

/** Lector: una tablet con una página de viñetas. */
export function ReaderIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 6.5h8v5H8zM8 14h3.5v3.5H8zM14 14h2v3.5h-2" />
    </Svg>
  );
}

/** Estadísticas: tres barras sobre una línea base. */
export function ChartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20h16" />
      <path d="M7 16v-5M12 16V6M17 16v-8" />
    </Svg>
  );
}

/** Comunidad: dos lectores (cabezas y hombros). */
export function CommunityIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
      <circle cx="16.5" cy="9" r="2.4" />
      <path d="M15.5 14.2c2.4 0 4.3 1.8 5 4.8" />
    </Svg>
  );
}

/** Más: tres puntos. */
export function MoreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </Svg>
  );
}

/** Flecha para «volver», «siguiente» y llamadas a la acción; `direction` la orienta. */
export function ArrowIcon({ direction = "right", ...props }: IconProps & { direction?: "left" | "right" }) {
  return (
    <Svg {...props}>
      <path d={direction === "right" ? "M5 12h14m-5-5 5 5-5 5" : "M19 12H5m5-5-5 5 5 5"} />
    </Svg>
  );
}

/** Pendiente: un marcapáginas. */
export function BookmarkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v16l-5-3.5L7 20z" />
    </Svg>
  );
}

/** Leído: una marca de verificación. */
export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

/** Abandonado: pausa (se puede retomar). */
export function PauseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6v12M15 6v12" />
    </Svg>
  );
}

/** Editar: un lápiz. */
export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 5.5 18.5 8.5M5 19l1-4 10-10 3 3-10 10z" />
    </Svg>
  );
}

/** Vista en rejilla: cuatro portadas. */
export function GridIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="6.5" height="7" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="7" rx="1" />
      <rect x="4" y="13" width="6.5" height="7" rx="1" />
      <rect x="13.5" y="13" width="6.5" height="7" rx="1" />
    </Svg>
  );
}

/** Vista por series: una carpeta. */
export function FolderIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 7.5V18a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-7.5L10 5.5H4.5a1 1 0 0 0-1 1z" />
    </Svg>
  );
}
