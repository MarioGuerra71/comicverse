"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RatingStarIcon } from "@/components/ui/icons";

const RATINGS = [1, 2, 3, 4, 5];

/** Puntuar un cómic leído sin salir del Inicio (la misma API que «Tu lectura» en la ficha). */
export function QuickRating({ comicId, rating }: { comicId: string; rating: number | null }) {
  const router = useRouter();
  const [value, setValue] = useState(rating);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const lit = hover ?? value ?? 0;

  async function rate(next: number | null) {
    const previous = value;
    setValue(next); // Al instante; si falla, se deshace.
    setError(false);
    const response = await fetch(`/api/v1/library/comics/${comicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: next }),
    }).catch(() => null);
    if (!response?.ok) {
      setValue(previous);
      setError(true);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 md:justify-start">
      <div role="group" aria-label="Tu puntuación" className="-ml-2.5 flex" onMouseLeave={() => setHover(null)}>
        {RATINGS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${n} de 5`}
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => rate(value === n ? null : n)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center transition-transform duration-150 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <RatingStarIcon
              size={24}
              filled={n <= lit}
              className={n <= lit ? "text-editor drop-shadow-[0_0_6px_var(--glow)]" : "text-ink-soft"}
            />
          </button>
        ))}
      </div>
      <span aria-live="polite" className="text-xs text-ink-soft">
        {error ? "No se ha podido guardar." : value ? `${value}/5` : "Puntúalo"}
      </span>
    </div>
  );
}
