import Link from "next/link";
import { BrandPanel } from "@/components/auth/brand-panel";
import { getSession } from "@/server/auth/session";

// Botones claros sobre el bloque rojo: papel con texto de tinta y recuadro blanco.
const lightButton =
  "inline-flex min-h-11 items-center justify-center border-2 border-ink bg-sheet px-5 text-sm font-semibold text-ink transition-colors hover:bg-sheet-raised";
const ghostButton =
  "inline-flex min-h-11 items-center justify-center border-2 border-white px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-editor-ink";

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
            </>
          )}
        </div>
      </BrandPanel>
    </main>
  );
}
