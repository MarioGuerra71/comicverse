import Link from "next/link";
import { BrandPanel } from "@/components/auth/brand-panel";
import { DemoButton } from "@/components/auth/demo-button";
import { getSession } from "@/server/auth/session";

// Botones sobre el bloque de la editorial: luz blanca y cristal.
const lightButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-all hover:shadow-[0_0_28px_rgb(255_255_255/0.45)]";
const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white ring-1 ring-white/60 backdrop-blur transition-colors hover:bg-white/10";

export default async function Home() {
  const session = await getSession();

  return (
    <main>
      <BrandPanel isPageTitle>
        <div className="flex flex-wrap gap-3">
          {session ? (
            <Link href="/dashboard" className={lightButton}>
              Ir a mi universo
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className={lightButton}>
                Crear cuenta
              </Link>
              <Link href="/sign-in" className={ghostButton}>
                Iniciar sesión
              </Link>
              <DemoButton className={ghostButton} />
            </>
          )}
        </div>
      </BrandPanel>
    </main>
  );
}
