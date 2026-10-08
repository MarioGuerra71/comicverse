"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Zone } from "@/lib/zones";
import { inkButton } from "@/components/ui/page-parts";

/** Añade una serie de Comic Vine al catálogo y abre el catálogo filtrado por ella. */
export function ImportSeriesButton({ externalId, zone }: { externalId: number; zone: Zone }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function add() {
    setState("loading");
    try {
      const response = await fetch("/api/v1/series/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId, publisher: zone }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const { seriesId } = (await response.json()) as { seriesId: string };
      router.push(`/catalog?seriesId=${seriesId}`);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={add} disabled={state === "loading"} className={inkButton}>
        {state === "loading" ? "Añadiendo…" : "Añadir al catálogo"}
      </button>
      {state === "loading" && (
        <p role="status" className="text-xs text-ink-soft">
          Trayendo todos sus cómics; una serie larga tarda unos segundos.
        </p>
      )}
      {state === "error" && (
        <p role="alert" className="text-xs text-danger">
          No se ha podido añadir. Inténtalo de nuevo en un momento.
        </p>
      )}
    </div>
  );
}
