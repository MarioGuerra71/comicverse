"use client";

import { usePathname, useRouter } from "next/navigation";
import { ZONE_COOKIE, ZONE_KEYS, ZONES, zoneSwitchTarget, type Zone } from "@/lib/zones";

function saveZone(zone: Zone) {
  document.cookie = `${ZONE_COOKIE}=${zone}; path=/; max-age=31536000; samesite=lax`;
}

/** Selector Marvel | DC: guarda la zona y lleva a la misma sección en la otra editorial (sin filtros de la anterior). */
export function ZoneSwitch({
  zone,
  compact = false,
  className = "",
}: {
  zone: Zone;
  /** Para el carril de iconos de la tablet: apilado y con la inicial. */
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function choose(next: Zone) {
    if (next === zone) return;
    saveZone(next);
    // push a la ruta sin query y refresh: la página se vuelve a pedir con la cookie nueva.
    router.push(zoneSwitchTarget(pathname));
    router.refresh();
  }

  return (
    <div role="group" aria-label="Editorial" className={`flex gap-1 rounded-full bg-black/30 p-1 ring-1 ring-edge ${compact ? "flex-col rounded-2xl" : ""} ${className}`}>
      {ZONE_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === zone}
          aria-label={compact ? ZONES[key].label : undefined}
          onClick={() => choose(key)}
          // La zona activa se enciende con su propio neón (rojo Marvel, azul DC).
          data-publisher={key}
          className={`min-h-10 flex-1 rounded-full ${compact ? "px-0" : "px-3"} text-sm font-bold transition-all duration-200 ${
            key === zone
              ? "bg-editor/20 text-ink ring-1 ring-editor shadow-[0_0_16px_var(--glow)]"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {compact && key === "marvel" ? "M" : ZONES[key].label}
        </button>
      ))}
    </div>
  );
}
