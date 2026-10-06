"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Copia local de los estados: los componentes cliente no importan nada de src/server.
const STATUS_LABELS = {
  PENDING: "Pendiente",
  READING: "Leyendo",
  READ: "Leído",
  DROPPED: "Abandonado",
} as const;

type Status = keyof typeof STATUS_LABELS;

export function StatusButtons({
  comicId,
  status,
}: {
  comicId: string;
  status: Status | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // isRefreshing sigue activo hasta que llegan los datos nuevos del servidor.
  const [isRefreshing, startTransition] = useTransition();
  const busy = saving || isRefreshing;
  const [error, setError] = useState<string | null>(null);

  // null = quitar de la biblioteca.
  async function save(next: Status | null) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/library/comics/${comicId}`, {
        method: next ? "PUT" : "DELETE",
        headers: next ? { "Content-Type": "application/json" } : undefined,
        body: next ? JSON.stringify({ status: next }) : undefined,
      });
      if (!response.ok) throw new Error(String(response.status));
      // Vuelve a pedir la página al servidor para mostrar el estado guardado.
      startTransition(() => router.refresh());
    } catch {
      setError("No se ha podido guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const buttonClass =
    "min-h-11 rounded-md border border-foreground/20 px-3 py-2 text-sm disabled:opacity-50";

  return (
    <section aria-labelledby="library-heading">
      <h2 id="library-heading" className="font-semibold">
        Tu biblioteca
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABELS) as Status[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            disabled={busy}
            onClick={() => save(value)}
            className={`${buttonClass} ${status === value ? "bg-foreground text-background" : ""}`}
          >
            {STATUS_LABELS[value]}
          </button>
        ))}
        {status && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save(null)}
            className={`${buttonClass} underline-offset-4 hover:underline`}
          >
            Quitar de la biblioteca
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
