"use client";

import Link from "next/link";
import { inkButton } from "@/components/ui/page-parts";

// Error inesperado en una página de la app. No se muestra el mensaje del error:
// puede contener detalles internos (en producción Next ya lo oculta).
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Algo se ha emborronado</h1>
      <p role="alert" className="text-sm text-ink-soft">
        No hemos podido cargar esta página. Prueba otra vez en unos segundos.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className={inkButton}>
          Reintentar
        </button>
        <Link href="/dashboard" className="text-sm text-ink underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
