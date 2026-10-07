"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "@/components/ui/icons";

export function FavoriteButton({
  characterId,
  isFavorite,
}: {
  characterId: string;
  isFavorite: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const busy = saving || isRefreshing;

  async function toggle() {
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`/api/v1/collection/characters/${characterId}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });
      if (!response.ok) throw new Error(String(response.status));
      startTransition(() => router.refresh());
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        aria-pressed={isFavorite}
        disabled={busy}
        onClick={toggle}
        className={`inline-flex min-h-11 items-center gap-2 rounded-md border border-foreground/20 px-3 py-2 text-sm disabled:opacity-50 ${
          isFavorite ? "bg-foreground text-background" : ""
        }`}
      >
        <HeartIcon filled={isFavorite} size={18} />
        {isFavorite ? "Favorito" : "Añadir a favoritos"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          No se ha podido guardar el cambio. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
