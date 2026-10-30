"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/ui/icons";

/** Marca un cómic como leído desde el Inicio y avisa de cuántos personajes has descubierto. */
export function MarkReadButton({ comicId, title }: { comicId: string; title: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function markRead() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/library/comics/${comicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READ" }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { unlock: { newCharacters: unknown[] } | null };
      const gained = data.unlock?.newCharacters.length ?? 0;
      setMessage(gained > 0 ? `¡${gained} ${gained === 1 ? "personaje nuevo" : "personajes nuevos"}!` : "Leído");
      startTransition(() => router.refresh());
    } catch {
      setMessage("No se ha podido guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={markRead}
        disabled={saving || isRefreshing}
        aria-label={`Marcar ${title} como leído`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
      >
        <CheckIcon size={16} />
        {saving ? "Guardando…" : "Leído"}
      </button>
      <p aria-live="polite" className="text-xs text-editor-ink">
        {message}
      </p>
    </div>
  );
}
