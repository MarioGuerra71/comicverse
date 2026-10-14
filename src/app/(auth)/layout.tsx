import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BRAND_VISITS_COOKIE, brandZoneForVisit } from "@/lib/zones";
import { BrandPanel } from "@/components/auth/brand-panel";
import { getSession } from "@/server/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  // La misma editorial que el bloque de la izquierda, para que el neón del formulario case.
  const zone = brandZoneForVisit(Number((await cookies()).get(BRAND_VISITS_COOKIE)?.value) || 0);

  // Escritorio: bloque de la editorial a la izquierda y formulario a la derecha. Móvil: apilados.
  return (
    <div data-publisher={zone} className="grid min-h-screen md:grid-cols-[1.15fr_1fr]">
      <BrandPanel zone={zone} />
      <main className="relative flex items-center justify-center overflow-hidden px-4 py-10 md:border-l md:border-edge">
        {/* Resplandor del neón detrás del formulario (decorativo). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--glow),transparent_60%)] opacity-50" />
        <div className="glass relative w-full max-w-sm rounded-3xl p-7 ring-1 ring-edge shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]">{children}</div>
      </main>
    </div>
  );
}
