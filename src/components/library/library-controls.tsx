"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  READING_STATUS_LABELS,
  READING_STATUSES,
  type ReadingStatusKey as Status,
} from "@/lib/reading-status";
import { UnlockPanel, type UnlockView } from "@/components/library/unlock-panel";

export interface LibraryControlsEntry {
  status: Status;
  isFavorite: boolean;
  rating: number | null;
}

const RATINGS = [1, 2, 3, 4, 5];

export function LibraryControls({
  comicId,
  entry,
  review,
}: {
  comicId: string;
  entry: LibraryControlsEntry | null;
  review: { body: string; updatedAt: string } | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // isRefreshing sigue activo hasta que llegan los datos nuevos del servidor.
  const [isRefreshing, startTransition] = useTransition();
  const busy = saving || isRefreshing;
  const [error, setError] = useState<string | null>(null);
  // Resultado del último cambio de estado que afectó a los desbloqueos.
  const [unlock, setUnlock] = useState<UnlockView | null>(null);

  // path: "" para la entrada de la biblioteca, "/review" para la reseña.
  async function send(method: "PUT" | "PATCH" | "DELETE", body?: object, path = "") {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/library/comics/${comicId}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw new Error(String(response.status));
      // Solo los cambios de estado (PUT/DELETE de la entrada) traen `unlock`.
      if (path === "" && method !== "PATCH") {
        const data = (await response.json()) as { unlock: UnlockView | null };
        setUnlock(data.unlock);
      }
      // Vuelve a pedir la página al servidor para mostrar lo guardado.
      startTransition(() => router.refresh());
    } catch {
      setError("No se ha podido guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const buttonClass =
    "min-h-11 rounded-md border border-foreground/20 px-3 py-2 text-sm disabled:opacity-50";
  const activeClass = "bg-foreground text-background";

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-3">
      <h2 id="library-heading" className="font-semibold">
        Tu biblioteca
      </h2>

      <div className="flex flex-wrap gap-2">
        {READING_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={entry?.status === value}
            disabled={busy}
            onClick={() => send("PUT", { status: value })}
            className={`${buttonClass} ${entry?.status === value ? activeClass : ""}`}
          >
            {READING_STATUS_LABELS[value]}
          </button>
        ))}
        {entry && (
          <button
            type="button"
            disabled={busy}
            onClick={() => send("DELETE")}
            className={`${buttonClass} underline-offset-4 hover:underline`}
          >
            Quitar de la biblioteca
          </button>
        )}
      </div>

      {entry && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={entry.isFavorite}
            disabled={busy}
            onClick={() => send("PATCH", { isFavorite: !entry.isFavorite })}
            className={`${buttonClass} ${entry.isFavorite ? activeClass : ""}`}
          >
            {entry.isFavorite ? "♥ Favorito" : "♡ Añadir a favoritos"}
          </button>
        </div>
      )}

      {entry?.status === "READ" ? (
        <div role="group" aria-label="Tu puntuación" className="flex flex-wrap items-center gap-2">
          <span className="text-sm opacity-70">Tu puntuación:</span>
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={entry.rating === value}
              aria-label={`${value} de 5`}
              disabled={busy}
              onClick={() => send("PATCH", { rating: value })}
              className={`${buttonClass} min-w-11 ${entry.rating !== null && value <= entry.rating ? activeClass : ""}`}
            >
              ★
            </button>
          ))}
          {entry.rating !== null && (
            <button
              type="button"
              disabled={busy}
              onClick={() => send("PATCH", { rating: null })}
              className="min-h-11 px-2 text-sm underline-offset-4 hover:underline disabled:opacity-50"
            >
              Quitar puntuación
            </button>
          )}
        </div>
      ) : (
        entry && <p className="text-sm opacity-70">Podrás puntuarlo cuando lo marques como leído.</p>
      )}

      {entry?.status === "READ" && (
        <form
          // key: si cambia la reseña guardada, el campo se reinicia con el texto nuevo.
          key={review?.updatedAt ?? "new"}
          onSubmit={(event) => {
            event.preventDefault();
            const body = new FormData(event.currentTarget).get("body");
            send("PUT", { body }, "/review");
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="review-body" className="text-sm opacity-70">
            Tu reseña (privada)
          </label>
          <textarea
            id="review-body"
            name="body"
            required
            maxLength={5000}
            rows={4}
            defaultValue={review?.body ?? ""}
            className="rounded-md border border-foreground/20 bg-transparent p-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={buttonClass}>
              {review ? "Guardar cambios" : "Guardar reseña"}
            </button>
            {review && (
              <button
                type="button"
                disabled={busy}
                onClick={() => send("DELETE", undefined, "/review")}
                className="min-h-11 px-2 text-sm underline-offset-4 hover:underline disabled:opacity-50"
              >
                Borrar reseña
              </button>
            )}
          </div>
        </form>
      )}

      {unlock && <UnlockPanel unlock={unlock} onClose={() => setUnlock(null)} />}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
