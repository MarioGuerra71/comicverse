"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  READING_STATUS_LABELS,
  READING_STATUSES,
  type ReadingStatusKey as Status,
} from "@/lib/reading-status";
import { formatDate } from "@/lib/format";
import { UnlockPanel, type UnlockView } from "@/components/library/unlock-panel";
import {
  BookmarkIcon,
  CatalogIcon,
  CheckIcon,
  HeartIcon,
  PauseIcon,
  PencilIcon,
  RatingStarIcon,
} from "@/components/ui/icons";
import { inkButton, inkField } from "@/components/ui/page-parts";

export interface LibraryControlsEntry {
  status: Status;
  isFavorite: boolean;
  rating: number | null;
  startedAt: string | null;
  readAt: string | null;
}

const RATINGS = [1, 2, 3, 4, 5];
const MAX_REVIEW = 5000;

const STATUS_ICONS: Record<Status, typeof CheckIcon> = {
  PENDING: BookmarkIcon,
  READING: CatalogIcon,
  READ: CheckIcon,
  DROPPED: PauseIcon,
};

/** La frase que resume dónde está el cómic en tu biblioteca. */
function statusLine(entry: LibraryControlsEntry | null) {
  if (!entry) return "Aún no está en tu biblioteca.";
  const day = (iso: string | null) => (iso ? formatDate(iso.slice(0, 10)) : null);
  if (entry.status === "READ") return day(entry.readAt) ? `Leído el ${day(entry.readAt)}` : "Leído";
  if (entry.status === "READING") return day(entry.startedAt) ? `Leyendo desde el ${day(entry.startedAt)}` : "Leyendo";
  if (entry.status === "DROPPED") return "Lo dejaste a medias. Puedes retomarlo cuando quieras.";
  return "En tu lista de pendientes.";
}

/**
 * «Tu lectura»: estado, favorito, puntuación y reseña de un cómic, en un panel de cristal.
 * Puntuar y reseñar solo se puede con el cómic leído.
 */
export function LibraryControls({
  comicId,
  entry,
  review,
  earlierUnread = 0,
}: {
  comicId: string;
  entry: LibraryControlsEntry | null;
  review: { body: string; isPublic: boolean; updatedAt: string } | null;
  /** Cómics anteriores de la misma serie que aún no has leído (para «hasta aquí»). */
  earlierUnread?: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // isRefreshing sigue activo hasta que llegan los datos nuevos del servidor.
  const [isRefreshing, startTransition] = useTransition();
  const busy = saving || isRefreshing;
  const [error, setError] = useState<string | null>(null);
  // Resultado del último cambio de estado que afectó a los desbloqueos.
  const [unlock, setUnlock] = useState<UnlockView | null>(null);
  // Estrellas iluminadas al pasar por encima (vista previa antes de puntuar).
  const [hover, setHover] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmUpTo, setConfirmUpTo] = useState(false);

  // path: "" para la entrada de la biblioteca, "/review" para la reseña.
  async function send(method: "PUT" | "PATCH" | "DELETE" | "POST", body?: object, path = "") {
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
      if (path === "/review") setEditing(false);
      if (path === "/read-up-to") {
        const data = (await response.json()) as {
          changed: number;
          unlock: UnlockView | null;
          achievements?: UnlockView["achievements"];
        };
        setUnlock(data.unlock ? { ...data.unlock, achievements: data.achievements ?? [], comics: data.changed } : null);
        setConfirmUpTo(false);
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
    "inline-flex min-h-11 items-center gap-1.5 px-2 text-sm text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-50";
  const lit = hover ?? entry?.rating ?? 0;
  const isRead = entry?.status === "READ";
  const upToTotal = earlierUnread + (isRead ? 0 : 1);

  return (
    <section aria-labelledby="library-heading" className="glass flex flex-col gap-5 rounded-3xl p-5 ring-1 ring-edge">
      <div>
        <h2 id="library-heading" className="font-display text-2xl font-extrabold tracking-wide text-ink uppercase">
          Tu lectura
        </h2>
        <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
          {statusLine(entry)}
        </p>
      </div>

      {/* Estado: cuatro botones grandes; el activo se enciende con el neón de la editorial. */}
      <div role="group" aria-label="Estado de lectura" className="grid grid-cols-2 gap-2">
        {READING_STATUSES.map((value) => {
          const Icon = STATUS_ICONS[value];
          const active = entry?.status === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={busy}
              onClick={() => send("PUT", { status: value })}
              className={`flex min-h-12 items-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-all duration-200 disabled:opacity-60 ${
                active
                  ? "bg-editor/15 text-ink ring-1 ring-editor shadow-[0_0_18px_var(--glow)] [&_svg]:text-editor"
                  : "bg-sheet text-ink-soft ring-1 ring-edge hover:bg-sheet-raised hover:text-ink"
              }`}
            >
              <Icon size={20} />
              {READING_STATUS_LABELS[value]}
            </button>
          );
        })}
      </div>

      {/* «Hasta aquí»: para ponerse al día con una serie de una vez. */}
      {earlierUnread > 0 &&
        (confirmUpTo ? (
          <div role="group" aria-label="Confirmar" className="rounded-2xl bg-sheet p-4 ring-1 ring-edge">
            <p className="text-sm text-ink">
              Se marcarán como leídos <strong>{upToTotal} cómics</strong> de esta serie: del primero hasta este.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => send("POST", undefined, "/read-up-to")} className={inkButton}>
                {busy ? "Marcando…" : "Sí, marcarlos"}
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirmUpTo(false)} className={quietButton}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmUpTo(true)}
            className="flex min-h-11 items-center gap-2 rounded-2xl border border-dashed border-edge px-3 text-left text-sm text-ink-soft transition-colors hover:bg-sheet-raised hover:text-ink disabled:opacity-60"
          >
            <CheckIcon size={18} />
            {earlierUnread === 1
              ? "Marcar también el anterior como leído"
              : `Marcar como leídos también los ${earlierUnread} anteriores`}
          </button>
        ))}

      {entry && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            aria-pressed={entry.isFavorite}
            disabled={busy}
            onClick={() => send("PATCH", { isFavorite: !entry.isFavorite })}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition-all disabled:opacity-60 ${
              entry.isFavorite
                ? "bg-editor/15 text-ink ring-editor [&_svg]:text-editor"
                : "bg-sheet text-ink-soft ring-edge hover:text-ink"
            }`}
          >
            <HeartIcon filled={entry.isFavorite} size={18} />
            Favorito
          </button>
          <button type="button" disabled={busy} onClick={() => send("DELETE")} className={quietButton}>
            Quitar de la biblioteca
          </button>
        </div>
      )}

      {/* Puntuación: las estrellas se iluminan al pasar por encima. */}
      <div className="border-t border-edge pt-4">
        <p className="text-xs tracking-wide text-ink-soft uppercase">Tu puntuación</p>
        {isRead ? (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <div role="group" aria-label="Tu puntuación" className="flex" onMouseLeave={() => setHover(null)}>
              {RATINGS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={entry.rating === value}
                  aria-label={`${value} de 5`}
                  disabled={busy}
                  onMouseEnter={() => setHover(value)}
                  onFocus={() => setHover(value)}
                  onBlur={() => setHover(null)}
                  onClick={() => send("PATCH", { rating: entry.rating === value ? null : value })}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center transition-transform duration-150 hover:scale-110 disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100"
                >
                  <RatingStarIcon
                    size={28}
                    filled={value <= lit}
                    className={value <= lit ? "text-editor drop-shadow-[0_0_6px_var(--glow)]" : "text-ink-soft"}
                  />
                </button>
              ))}
            </div>
            {entry.rating !== null && (
              <span className="font-display text-2xl font-extrabold text-ink">{entry.rating}/5</span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">Márcalo como leído para puntuarlo y reseñarlo.</p>
        )}
      </div>

      {isRead && (
        <div className="border-t border-edge pt-4">
          <p className="text-xs tracking-wide text-ink-soft uppercase">Tu reseña</p>
          {review && !editing ? (
            // La reseña guardada, como una cita; se edita en el sitio.
            <figure className="mt-2">
              <blockquote className="border-l-2 border-editor pl-4 text-sm leading-relaxed whitespace-pre-line text-ink">
                {review.body}
              </blockquote>
              <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-ink-soft">
                <span>{review.isPublic ? "Pública en tu perfil" : "Solo la ves tú"}</span>
                <span>· {formatDate(review.updatedAt.slice(0, 10))}</span>
              </figcaption>
              <div className="mt-2 flex flex-wrap gap-1">
                <button type="button" disabled={busy} onClick={() => setEditing(true)} className={quietButton}>
                  <PencilIcon size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => send("DELETE", undefined, "/review")}
                  className={quietButton}
                >
                  Borrar
                </button>
              </div>
            </figure>
          ) : (
            <ReviewEditor
              initial={review}
              busy={busy}
              onCancel={review ? () => setEditing(false) : undefined}
              onSave={(body, isPublic) => send("PUT", { body, isPublic }, "/review")}
            />
          )}
        </div>
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

/** Editor de la reseña: texto con contador y un interruptor para hacerla pública. */
function ReviewEditor({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial: { body: string; isPublic: boolean } | null;
  busy: boolean;
  onCancel?: () => void;
  onSave: (body: string, isPublic: boolean) => void;
}) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(body, isPublic);
      }}
      className="mt-2 flex flex-col gap-3"
    >
      <label htmlFor="review-body" className="sr-only">
        Tu reseña
      </label>
      <textarea
        id="review-body"
        required
        maxLength={MAX_REVIEW}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="¿Qué te ha parecido? Sin spoilers, por favor."
        className={`${inkField} resize-y py-3 leading-relaxed`}
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          className="flex min-h-11 items-center gap-3 text-left text-sm text-ink"
        >
          <span
            aria-hidden="true"
            className={`relative h-6 w-11 shrink-0 rounded-full border border-edge transition-colors ${
              isPublic ? "bg-editor shadow-[0_0_12px_var(--glow)]" : "bg-paper"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-ink transition-all duration-200 ${
                isPublic ? "left-[calc(100%-1.25rem)]" : "left-0.5"
              }`}
            />
          </span>
          Mostrarla en tu perfil público
        </button>
        <span className="text-xs text-ink-soft tabular-nums">
          {body.length}/{MAX_REVIEW}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={busy || !body.trim()} className={inkButton}>
          {initial ? "Guardar cambios" : "Publicar reseña"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 px-2 text-sm text-ink-soft hover:text-ink"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
