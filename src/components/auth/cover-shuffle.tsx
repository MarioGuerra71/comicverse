"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Giros de las portadas, como cómics esparcidos sobre la mesa.
const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];
const INTERVAL_MS = 4500;

/**
 * Mosaico de portadas que cambia de grupo cada pocos segundos; cada portada aparece con un
 * pequeño retraso respecto a la anterior. Con «reducir movimiento» se queda en el primer grupo.
 */
export function CoverShuffle({ groups, compactOnMobile }: { groups: string[][]; compactOnMobile: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (groups.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % groups.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [groups.length]);

  // Precarga el grupo siguiente para que no aparezcan huecos al cambiar.
  useEffect(() => {
    for (const src of groups[(current + 1) % groups.length] ?? []) new window.Image().src = src;
  }, [current, groups]);

  return (
    <ul aria-hidden="true" className="grid grid-cols-3 gap-3 md:max-w-lg md:gap-5">
      {(groups[current] ?? []).map((src, index) => (
        <li
          // La clave cambia con el grupo: React monta la portada nueva y su animación se repite.
          key={`${current}-${index}`}
          style={{ animationDelay: `${index * 90}ms` }}
          className={`${TILTS[index % TILTS.length]} motion-safe:animate-pop-in ${
            // En el móvil del acceso, una sola fila (deja sitio al formulario).
            compactOnMobile && index >= 3 ? "hidden md:block" : ""
          }`}
        >
          <div className="relative aspect-2/3 overflow-hidden border-2 border-ink bg-sheet">
            <Image src={src} alt="" fill unoptimized sizes="160px" className="object-cover" />
          </div>
        </li>
      ))}
    </ul>
  );
}
