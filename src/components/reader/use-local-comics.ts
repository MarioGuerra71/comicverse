"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CHANGE_EVENT, readLocalPage, type LocalComic } from "@/lib/reader/local-library";

const KEY = "comicverse-reader-v1";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Los cómics descargados en este dispositivo (se actualiza solo al importar, enlazar o borrar). */
export function useLocalComics(): LocalComic[] | null {
  // El texto guardado es estable entre lecturas; la lista se reconstruye solo si cambia.
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(KEY) ?? "[]",
    () => null,
  );
  return useMemo(() => {
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as LocalComic[];
    } catch {
      return [];
    }
  }, [raw]);
}

/** URL de una página guardada (se libera al cambiar o desmontar). */
export function usePageUrl(comic: LocalComic | null, index: number) {
  const [url, setUrl] = useState<string | null>(null);
  // Solo datos fijos del cómic: guardar la página por la que vas no debe recargar la imagen.
  const id = comic?.id;
  const ext = comic?.extensions[index];
  useEffect(() => {
    if (!id || !ext) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    readLocalPage(id, index, ext)
      .then((file) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, index, ext]);
  return url;
}
