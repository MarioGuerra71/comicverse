import Link from "next/link";
import { cookies } from "next/headers";
import { BRAND_VISITS_COOKIE, brandZoneForVisit, type Zone } from "@/lib/zones";
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
  zone: forcedZone,
}: {
  children?: React.ReactNode;
  /** En la portada el titular es el h1; en el acceso, el h1 es el del formulario. */
  isPageTitle?: boolean;
  /** Editorial ya elegida por quien la envuelve (a partir de la 3.ª visita es al azar). */
  zone?: Zone;
}) {
  const Heading = isPageTitle ? "h1" : "p";
  const zone = forcedZone ?? brandZoneForVisit(Number((await cookies()).get(BRAND_VISITS_COOKIE)?.value) || 0);

  // Cuatro grupos de seis portadas de la editorial, repartidos por su catálogo (de lo más
  // antiguo a lo más reciente). Si una editorial tiene pocos cómics, salen menos grupos.
  const first = await searchComics(db, comicSearchSchema.parse({ publisher: zone, sort: "release_asc", pageSize: 6 }));
  const last = first.totalPages;
  const pages = [...new Set([1, Math.ceil(last / 3), Math.ceil((2 * last) / 3), last])];
  const results = await Promise.all(
    pages.map((page) =>
      page === 1
        ? first
        : searchComics(db, comicSearchSchema.parse({ publisher: zone, sort: "release_asc", pageSize: 6, page })),
    ),
  );
  const groups = results
    .map((r) => r.items.flatMap((c) => (c.coverThumbUrl ? [c.coverThumbUrl] : [])))
    .filter((g) => g.length === 6);

  const intro = (
    <>
      <Link href="/" className="inline-flex items-center gap-2 self-start font-display text-2xl font-black tracking-wide text-white uppercase [text-shadow:0_0_18px_rgb(255_255_255/0.5)]">
        <PanelMark size={26} />
        ComicVerse
      </Link>
      <div>
        <Heading
          className={`font-display text-5xl leading-[0.9] font-black tracking-tight text-white uppercase md:text-7xl ${
            isPageTitle ? "lg:text-8xl" : ""
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
      <section data-publisher={zone} className="grid min-h-screen items-center gap-10 overflow-hidden bg-brand-fade-y px-6 py-10 md:grid-cols-[1fr_1.1fr] md:px-12 lg:gap-16 lg:px-20">
        <div className="flex flex-col gap-6">{intro}</div>
        <CoverShuffle groups={groups} compactOnMobile={false} className="w-full md:max-w-2xl" />
      </section>
    );
  }

  return (
    <section data-publisher={zone} className="relative flex flex-col justify-center gap-6 overflow-hidden bg-brand-fade-y px-6 py-8 md:px-12 md:py-12">
      {intro}
      <CoverShuffle groups={groups} compactOnMobile />
    </section>
  );
}
