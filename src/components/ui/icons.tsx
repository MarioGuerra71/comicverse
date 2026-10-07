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
