"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ComicListItemDto } from "@/server/dto/comic";
import {
  READING_STATUS_LABELS,
  READING_STATUSES,
  type ReadingStatusKey as Status,
} from "@/lib/reading-status";
import { ComicCard } from "@/components/comics/comic-card";
import { UnlockPanel, type UnlockView } from "@/components/library/unlock-panel";
import { CheckIcon } from "@/components/ui/icons";
import { inkButton, inkField, outlineButton } from "@/components/ui/page-parts";

export interface GridItem {
  comic: ComicListItemDto;
  /** Nota a mano bajo la portada (estado, puntuación…). */
  note?: string;
}

/**
 * Rejilla de cómics con «Seleccionar varios»: tocas las portadas que quieras y las marcas todas
 * de golpe (por ejemplo, los 6 que leíste ayer). Sin el modo selección, cada portada abre su ficha.
 */
export function SelectableComicGrid({ items }: { items: GridItem[] }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("READ");
  const [saving, setSaving] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [result, setResult] = useState<{ unlock: UnlockView | null; changed: number; status: Status } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = saving || isRefreshing;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stop() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function apply() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/library/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicIds: [...selected], status }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as {
        changed: number;
        unlock: UnlockView | null;
        achievements: UnlockView["achievements"];
      };
      setResult({
        changed: data.changed,
        status,
        unlock: data.unlock ? { ...data.unlock, achievements: data.achievements, comics: data.changed } : null,
      });
      stop();
      startTransition(() => router.refresh());
    } catch {
      setError("No se han podido guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const count = selected.size;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {selecting ? (
          <>
            <button
              type="button"
              onClick={() => setSelected(new Set(items.map((i) => i.comic.id)))}
              className={outlineButton}
            >
              Seleccionar los {items.length} de esta página
            </button>
            <button type="button" onClick={stop} className="min-h-11 px-3 text-sm text-ink-soft hover:text-ink">
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSelecting(true)}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <CheckIcon size={16} />
            Seleccionar varios
          </button>
        )}
      </div>

      {result && (
        <div className="mt-4">
          {result.unlock ? (
            <UnlockPanel unlock={result.unlock} onClose={() => setResult(null)} />
          ) : (
            <p role="status" className="rounded-2xl border border-edge bg-sheet p-4 text-sm text-ink">
              {result.changed === 0
                ? "Ya estaban todos así: no ha cambiado nada."
                : `${result.changed === 1 ? "1 cómic" : `${result.changed} cómics`} en «${READING_STATUS_LABELS[result.status]}».`}{" "}
              <button type="button" onClick={() => setResult(null)} className="ml-2 text-ink-soft underline">
                Cerrar
              </button>
            </p>
          )}
        </div>
      )}

      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map(({ comic, note }, index) => {
          const isSelected = selected.has(comic.id);
          return (
            <li key={comic.id} className="relative flex flex-col">
              <ComicCard comic={comic} eager={index < 6} />
              {note && <p className="mt-1 font-hand text-lg leading-tight font-bold text-ink">{note}</p>}
              {selecting && (
                // En modo selección, la portada entera es un interruptor (tapa el enlace a la ficha).
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Seleccionar ${comic.title}`}
                  onClick={() => toggle(comic.id)}
                  className={`absolute inset-0 z-10 rounded-lg transition-all duration-150 ${
                    isSelected ? "bg-editor/10 ring-2 ring-editor shadow-[0_0_24px_var(--glow)]" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-colors ${
                      isSelected ? "bg-editor text-white ring-editor" : "bg-black/60 text-transparent ring-white/60"
                    }`}
                  >
                    <CheckIcon size={18} />
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {selecting && (
        // Barra fija con lo seleccionado; en el móvil, encima de la barra de pestañas.
        <div className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-3xl glass p-3 pl-5 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-edge md:bottom-6">
          <p className="text-sm text-ink" aria-live="polite">
            <span className="font-display text-2xl font-extrabold">{count}</span>{" "}
            {count === 1 ? "seleccionado" : "seleccionados"}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="bulk-status" className="sr-only">
              Marcar como
            </label>
            <select
              id="bulk-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className={`${inkField} rounded-full`}
            >
              {READING_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {READING_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <button type="button" onClick={apply} disabled={count === 0 || busy} className={inkButton}>
              {busy ? "Guardando…" : "Marcar"}
            </button>
          </div>
          {error && (
            <p role="alert" className="w-full text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
