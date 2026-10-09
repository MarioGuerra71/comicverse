"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  READING_STATUS_LABELS,
  READING_STATUSES,
  type ReadingStatusKey as Status,
} from "@/lib/reading-status";
import { UnlockPanel, type UnlockView } from "@/components/library/unlock-panel";
import { HeartIcon, RatingStarIcon } from "@/components/ui/icons";
import { inkButton, inkField, inkTab } from "@/components/ui/page-parts";

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
        const data = (await response.json()) as {
          unlock: UnlockView | null;
          achievements?: UnlockView["achievements"];
        };
        setUnlock(data.unlock ? { ...data.unlock, achievements: data.achievements ?? [] } : null);
      }
      // Vuelve a pedir la página al servidor para mostrar lo guardado.
      startTransition(() => router.refresh());
    } catch {
      setError("No se ha podido guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const quietButton =
    "min-h-11 px-2 text-sm text-ink underline underline-offset-4 disabled:opacity-50";

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-3">
      <h2 id="library-heading" className="text-lg font-extrabold text-ink">
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
            className={`${inkTab(entry?.status === value)} disabled:opacity-50`}
          >
            {READING_STATUS_LABELS[value]}
          </button>
        ))}
        {entry && (
          <button
            type="button"
            disabled={busy}
            onClick={() => send("DELETE")}
            className={quietButton}
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
            className={`${inkTab(entry.isFavorite)} gap-2 disabled:opacity-50`}
          >
            <HeartIcon filled={entry.isFavorite} size={18} />
            {entry.isFavorite ? "Favorito" : "Añadir a favoritos"}
          </button>
        </div>
      )}

      {entry?.status === "READ" ? (
        <div role="group" aria-label="Tu puntuación" className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-sm text-ink-soft">Tu puntuación</span>
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={entry.rating === value}
              aria-label={`${value} de 5`}
              disabled={busy}
              onClick={() => send("PATCH", { rating: value })}
              className="inline-flex min-h-11 min-w-11 items-center justify-center disabled:opacity-50"
            >
              <RatingStarIcon
                size={20}
                filled={entry.rating !== null && value <= entry.rating}
                className={entry.rating !== null && value <= entry.rating ? "text-ink" : "text-ink-soft"}
              />
            </button>
          ))}
          {entry.rating !== null && (
            <button
              type="button"
              disabled={busy}
              onClick={() => send("PATCH", { rating: null })}
              className={quietButton}
            >
              Quitar puntuación
            </button>
          )}
        </div>
      ) : (
        entry && <p className="text-sm text-ink-soft">Podrás puntuarlo cuando lo marques como leído.</p>
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
          <label htmlFor="review-body" className="text-sm text-ink-soft">
            Tu reseña (privada)
          </label>
          <textarea
            id="review-body"
            name="body"
            required
            maxLength={5000}
            rows={4}
            defaultValue={review?.body ?? ""}
            className={`${inkField} py-2`}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={inkButton}>
              {review ? "Guardar cambios" : "Guardar reseña"}
            </button>
            {review && (
              <button
                type="button"
                disabled={busy}
                onClick={() => send("DELETE", undefined, "/review")}
                className={quietButton}
              >
                Borrar reseña
              </button>
            )}
          </div>
        </form>
      )}

      {unlock && <UnlockPanel unlock={unlock} onClose={() => setUnlock(null)} />}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
