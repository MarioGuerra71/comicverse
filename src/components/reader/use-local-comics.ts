"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CHANGE_EVENT, readLocalPage, STORAGE_KEY, type LocalComic } from "@/lib/reader/local-library";

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
    () => localStorage.getItem(STORAGE_KEY) ?? "[]",
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

/**
 * URL de una página guardada (se libera al cambiar o desmontar). `failed` avisa si no se ha podido
 * leer, para no dejar la pantalla en negro sin explicación.
 */
export function usePageUrl(id: string | undefined, index: number, pages = Infinity) {
  const [state, setState] = useState<{ key: string; url: string | null; failed: boolean } | null>(null);
  const key = `${id}/${index}`;
  useEffect(() => {
    if (!id || index < 0 || index >= pages) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    readLocalPage(id, index)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ key: `${id}/${index}`, url: objectUrl, failed: false });
      })
      .catch(() => !cancelled && setState({ key: `${id}/${index}`, url: null, failed: true }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, index, pages]);
  // Mientras llega la página nueva no se enseña la anterior.
  return state?.key === key ? state : { url: null, failed: false };
}
