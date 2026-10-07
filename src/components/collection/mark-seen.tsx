"use client";

import { useEffect } from "react";

/**
 * Al abrir la colección, avisa al servidor de que ya se ha visto lo nuevo. Se hace desde
 * el navegador, no al generar la página: generarla no debe cambiar datos.
 */
export function MarkCollectionSeen() {
  useEffect(() => {
    fetch("/api/v1/collection/seen", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
