"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CharacterVersionDto } from "@/server/dto/character";
import { CheckIcon } from "@/components/ui/icons";
import { inkButton, inkField } from "@/components/ui/page-parts";

/**
 * Sus versiones: una por cada serie en la que lo has leído. En cada una eliges la imagen que
 * llevará su carta en ese álbum: la original, una portada de esa serie o el enlace que quieras.
 */
export function VersionPicker({
  characterId,
  characterName,
  originalImage,
  versions,
  initialSeriesId,
}: {
  characterId: string;
  characterName: string;
  originalImage: string | null;
  versions: CharacterVersionDto[];
  initialSeriesId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(initialSeriesId ?? null);
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const busy = saving || isRefreshing;

  async function choose(seriesId: string, imageUrl: string | null) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/collection/characters/${characterId}/versions/${seriesId}`, {
        method: imageUrl ? "PUT" : "DELETE",
        headers: imageUrl ? { "Content-Type": "application/json" } : undefined,
        body: imageUrl ? JSON.stringify({ imageUrl }) : undefined,
      });
      if (response.status === 400) throw new Error("link");
      if (!response.ok) throw new Error(String(response.status));
      setLink("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(
        e instanceof Error && e.message === "link"
          ? "Ese enlace no vale: tiene que empezar por https://."
          : "No se ha podido guardar la imagen. Inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
      {versions.map((version) => {
        const current = version.imageUrl ?? originalImage;
        const isOpen = open === version.seriesId;
        // La original primero; después las portadas (sin repetir la original).
        const options = [
          { url: null, label: "Original", src: originalImage },
          ...version.covers.filter((c) => c !== originalImage).map((c) => ({ url: c, label: "Portada", src: c })),
        ];
        return (
          <li key={version.seriesId} className="py-3">
            <div className="flex items-center gap-4">
              <div className="relative aspect-3/4 w-12 shrink-0 overflow-hidden rounded-md bg-sheet ring-1 ring-edge">
                {current && <Image src={current} alt="" fill unoptimized sizes="48px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{version.seriesTitle}</p>
                <p className="text-xs text-ink-soft">{version.imageUrl ? "Imagen elegida por ti" : "Imagen original"}</p>
              </div>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : version.seriesId)}
                className="min-h-11 px-2 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                {isOpen ? "Cerrar" : "Cambiar"}
              </button>
            </div>

            {isOpen && (
              <div className="mt-4">
                <div role="group" aria-label={`Imagen de ${characterName} en ${version.seriesTitle}`} className="flex flex-wrap gap-3">
                  {options.map((option) => {
                    const selected = (version.imageUrl ?? null) === option.url;
                    return (
                      <button
                        key={option.url ?? "original"}
                        type="button"
                        aria-pressed={selected}
                        aria-label={option.label}
                        disabled={busy || selected}
                        onClick={() => choose(version.seriesId, option.url)}
                        className={`relative aspect-3/4 w-20 overflow-hidden rounded-md bg-sheet transition-shadow disabled:cursor-default ${
                          selected ? "ring-2 ring-editor" : "ring-1 ring-edge hover:ring-line-strong"
                        }`}
                      >
                        {option.src ? (
                          <Image src={option.src} alt="" fill unoptimized sizes="80px" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-ink-soft">Sin imagen</span>
                        )}
                        {option.url === null && (
                          <span className="absolute inset-x-0 bottom-0 bg-paper/80 py-0.5 text-center text-[11px] text-ink">
                            Original
                          </span>
                        )}
                        {selected && (
                          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-editor text-white">
                            <CheckIcon size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    choose(version.seriesId, link.trim());
                  }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  <label htmlFor={`link-${version.seriesId}`} className="w-full text-xs text-ink-soft">
                    O pega el enlace de cualquier imagen (clic derecho en la imagen → «Copiar dirección de la imagen»)
                  </label>
                  <input
                    id={`link-${version.seriesId}`}
                    type="url"
                    required
                    inputMode="url"
                    placeholder="https://…"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className={`${inkField} min-w-0 flex-1`}
                  />
                  <button type="submit" disabled={busy || !link.trim()} className={inkButton}>
                    Usar esta
                  </button>
                </form>
              </div>
            )}
          </li>
        );
      })}
      {error && (
        <li role="alert" className="py-3 text-sm text-danger">
          {error}
        </li>
      )}
    </ul>
  );
}
