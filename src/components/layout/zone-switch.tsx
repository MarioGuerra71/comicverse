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
    <div role="group" aria-label="Editorial" className={`flex ${compact ? "flex-col" : ""} ${className}`}>
      {ZONE_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === zone}
          aria-label={compact ? ZONES[key].label : undefined}
          onClick={() => choose(key)}
          className={`min-h-11 flex-1 border-2 border-white ${compact ? "px-0" : "px-3"} text-sm font-bold transition-colors ${
            key === zone ? "bg-white text-editor-ink" : "text-white hover:bg-white/15"
          }`}
        >
          {compact && key === "marvel" ? "M" : ZONES[key].label}
        </button>
      ))}
    </div>
  );
}
