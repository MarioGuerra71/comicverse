import Link from "next/link";
import { db } from "@/lib/db";
import { CoverShuffle } from "@/components/auth/cover-shuffle";
import { PanelMark } from "@/components/ui/icons";
import { searchComics } from "@/server/services/catalog";
import { comicSearchSchema } from "@/server/validation/catalog";

/**
 * Bloque de la editorial para la portada y el acceso: marca, frase y un mosaico de portadas
 * reales del catálogo que va cambiando por épocas. Las portadas no son spoilers: el
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
  // Cuatro grupos de seis portadas de épocas distintas (de los años 60 a hoy).
  const pages = [
    { sort: "release_asc", page: 2 },
    { sort: "release_asc", page: 40 },
    { sort: "release_asc", page: 80 },
    { sort: "release_desc", page: 1 },
  ];
  const results = await Promise.all(
    pages.map((p) => searchComics(db, comicSearchSchema.parse({ ...p, pageSize: 6 }))),
  );
  const groups = results
    .map((r) => r.items.flatMap((c) => (c.coverThumbUrl ? [c.coverThumbUrl] : [])))
    .filter((g) => g.length === 6);

  const intro = (
    <>
      <Link href="/" className="inline-flex items-center gap-2 self-start text-xl font-extrabold text-white">
        <PanelMark size={26} />
        ComicVerse
      </Link>
      <div>
        <Heading
          className={`text-4xl leading-[1.05] font-extrabold tracking-tight text-white md:text-6xl ${
            isPageTitle ? "lg:text-7xl" : ""
          }`}
        >
          Lee cómics.
          <br />
          Descubre su universo.
        </Heading>
        <p className="mt-3 max-w-md text-lg font-medium text-white">
          Cada cómic que marcas como leído desbloquea a sus personajes y las relaciones entre ellos.
        </p>
      </div>
      {children}
    </>
  );

  // Portada: dos columnas en escritorio (texto | mosaico grande). Acceso: apilado, porque el
  // formulario ya ocupa la otra mitad de la pantalla.
  if (isPageTitle) {
    return (
      <section className="grid min-h-screen items-center gap-10 overflow-hidden bg-brand-fade-y px-6 py-10 md:grid-cols-[1fr_1.1fr] md:px-12 lg:gap-16 lg:px-20">
        <div className="flex flex-col gap-6">{intro}</div>
        <CoverShuffle groups={groups} compactOnMobile={false} className="w-full md:max-w-2xl" />
      </section>
    );
  }

  return (
    <section className="relative flex flex-col justify-center gap-6 overflow-hidden bg-brand-fade-y px-6 py-8 md:px-12 md:py-12">
      {intro}
      <CoverShuffle groups={groups} compactOnMobile />
    </section>
  );
}
