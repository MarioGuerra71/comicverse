import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { PanelMark } from "@/components/ui/icons";
import { searchComics } from "@/server/services/catalog";
import { comicSearchSchema } from "@/server/validation/catalog";

// Giros de las portadas, como cómics esparcidos sobre la mesa.
const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];

/**
 * Bloque de la editorial para la portada y el acceso: marca, frase y un mosaico de portadas
 * reales del catálogo (tres clásicas y tres recientes). Las portadas no son spoilers: el
 * catálogo es visible para cualquier usuario.
 */
export async function BrandPanel({
  children,
  isPageTitle = false,
}: {
  children?: React.ReactNode;
  /** En la portada el titular es el h1; en el acceso, el h1 es el del formulario. */
  isPageTitle?: boolean;
}) {
  const Heading = isPageTitle ? "h1" : "p";
  const [classic, recent] = await Promise.all([
    searchComics(db, comicSearchSchema.parse({ sort: "release_asc", pageSize: 3, page: 2 })),
    searchComics(db, comicSearchSchema.parse({ sort: "release_desc", pageSize: 3 })),
  ]);
  const covers = [...classic.items, ...recent.items].filter((c) => c.coverThumbUrl);

  return (
    <section className="relative flex flex-col gap-6 justify-center overflow-hidden bg-brand-fade-y px-6 py-8 md:px-12 md:py-12">
      <Link href="/" className="inline-flex items-center gap-2 self-start text-xl font-extrabold text-white">
        <PanelMark size={26} />
        ComicVerse
      </Link>
      <div>
        <Heading className="text-4xl leading-[1.05] font-extrabold tracking-tight text-white md:text-6xl">
          Lee cómics.
          <br />
          Descubre su universo.
        </Heading>
        <p className="mt-3 max-w-md text-lg font-medium text-white">
          Cada cómic que marcas como leído desbloquea a sus personajes y las relaciones entre ellos.
        </p>
      </div>
      {children}
      <ul aria-hidden="true" className="grid grid-cols-3 gap-3 md:max-w-lg md:gap-5">
        {covers.map((comic, index) => (
          <li
            key={comic.id}
            // En el móvil del acceso, una sola fila de tres portadas (deja sitio al formulario).
            className={`${TILTS[index % TILTS.length]} ${index >= 3 && !isPageTitle ? "hidden md:block" : ""}`}
          >
            <div className="relative aspect-2/3 overflow-hidden border-2 border-ink bg-sheet">
              <Image src={comic.coverThumbUrl!} alt="" fill unoptimized className="object-cover" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
