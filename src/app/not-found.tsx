import Link from "next/link";
import { StarMark } from "@/components/ui/icons";

// Página 404 en el mundo de la app (la de Next por defecto trae su propio estilo).
// También la usan los personajes bloqueados: no revela si existen.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <StarMark size={28} className="text-dim" />
      <h1 className="font-display text-3xl tracking-wide text-star">Aquí no hay nada</h1>
      <p className="max-w-sm text-sm text-dim">
        Esta página no existe o todavía no la has descubierto.
      </p>
      <Link href="/dashboard" className="text-sm text-star underline">
        Volver al inicio
      </Link>
    </main>
  );
}
