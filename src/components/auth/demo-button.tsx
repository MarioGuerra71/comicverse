"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** «Probar la demo»: crea una cuenta temporal con cómics ya leídos y entra en ella. */
export function DemoButton({ className }: { className: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/v1/demo", { method: "POST" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setLoading(false);
    setError(
      res.status === 429
        ? "Demasiadas demos desde esta conexión. Prueba dentro de un rato."
        : "No se pudo abrir la demo. Inténtalo de nuevo.",
    );
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Preparando la demo…" : "Probar la demo"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}
