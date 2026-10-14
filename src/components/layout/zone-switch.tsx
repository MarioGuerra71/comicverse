"use client";

import { useRouter } from "next/navigation";
import { ZONE_COOKIE, ZONE_KEYS, ZONES, type Zone } from "@/lib/zones";

function saveZone(zone: Zone) {
  document.cookie = `${ZONE_COOKIE}=${zone}; path=/; max-age=31536000; samesite=lax`;
}

/** Selector Marvel | DC sobre el bloque de la editorial: guarda la zona y recarga los datos. */
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

  function choose(next: Zone) {
    if (next === zone) return;
    saveZone(next);
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
              ? "bg-editor text-white shadow-[0_0_16px_var(--glow)]"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {compact && key === "marvel" ? "M" : ZONES[key].label}
        </button>
      ))}
    </div>
  );
}
