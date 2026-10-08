import { redirect } from "next/navigation";
import { BrandPanel } from "@/components/auth/brand-panel";
import { getSession } from "@/server/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  // Escritorio: bloque de la editorial a la izquierda y formulario a la derecha. Móvil: apilados.
  return (
    <div className="grid min-h-screen md:grid-cols-[1.15fr_1fr]">
      <BrandPanel />
      <main className="flex items-center justify-center px-4 py-10 md:border-l-2 md:border-ink">
        <div className="w-full max-w-sm border-2 border-ink bg-sheet p-6">{children}</div>
      </main>
    </div>
  );
}
