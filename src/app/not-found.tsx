import Link from "next/link";
import { PanelMark } from "@/components/ui/icons";

// Página 404 en el mundo de la app (la de Next por defecto trae su propio estilo).
// También la usan los personajes bloqueados: no revela si existen.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <PanelMark size={32} className="text-ink" />
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Aquí no hay nada</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        Esta página no existe o todavía no la has descubierto.
      </p>
      <Link href="/dashboard" className="text-sm text-ink underline">
        Volver al inicio
      </Link>
    </main>
  );
}
