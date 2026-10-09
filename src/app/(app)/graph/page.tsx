import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pluralize } from "@/lib/format";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { ZONES } from "@/lib/zones";
import { CARD_STATE_LABELS } from "@/components/characters/character-card";
import { PageHeader } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { packGroups, type CastGroupKey, type CollectionCardDto } from "@/server/dto/character";
import { getCastPage } from "@/server/services/discovery";
import { graphSearchSchema } from "@/server/validation/graph";
import { getZone } from "@/server/zone";

export const metadata: Metadata = { title: "Universo · ComicVerse" };

// Rótulos a mano de cada grupo del reparto.
const GROUP_LABELS: Record<CastGroupKey, string> = {
  ALLY: "aliados",
  ENEMY: "enemigos",
  FAMILY: "familia",
  PARTNER: "pareja",
  COMPANION: "compañeros",
  RIVAL: "rivales",
  TOGETHER: "aparecen juntos",
};

// Números a mano siempre con tres cifras (DESIGN.md, Handwritten Digits Rule).
const pad = (n: number) => String(n).padStart(3, "0");

/** Miniaturas de la primera fila de la tira en escritorio (cabe desde 1024 px de ancho). */
const DESKTOP_ROW = 12;

/** Huecos a lápiz que se dibujan como mucho para las relaciones por descubrir. */
const MAX_HIDDEN_PANELS = 6;

function Panel({ card, className = "" }: { card: CollectionCardDto; className?: string }) {
  return (
    <span className={`relative block aspect-3/4 overflow-hidden border-2 border-ink bg-sheet ${className}`}>
      {card.imageThumbUrl ? (
        <Image
          src={card.imageThumbUrl}
          alt=""
          fill
          unoptimized
          sizes="200px"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-xs text-ink-soft">Sin imagen</span>
      )}
    </span>
  );
}

export default async function UniversePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const parsed = graphSearchSchema.safeParse(normalizeParams(await searchParams));
  if (!parsed.success) notFound();

  const zone = await getZone();
  // Protagonista bloqueado o inexistente: el mismo 404 que su ficha.
  const page = await getCastPage(db, user.id, zone, parsed.data.focus);
  if (!page) notFound();
  const { focus, hidden, cast, relationships } = page;
  // Filas de 5 sin huecos (ver packGroups); el orden del DOM es el visual.
  const groups = packGroups(page.groups, 5);
  const activeIndex = cast.findIndex((c) => c.id === focus?.id);

  const thumb = (c: CollectionCardDto) => {
    const active = c.id === focus?.id;
    return (
      <li key={c.id} className="w-12 shrink-0 snap-start">
        <Link
          href={`/graph?focus=${c.id}`}
          aria-label={c.name}
          aria-current={active ? "page" : undefined}
          title={c.name}
          className="group block py-1"
        >
          {/* Seleccionado en tinta (el contorno del editor queda para el foco del teclado). */}
          <Panel card={c} className={active ? "outline-[3px] outline-offset-2 outline-ink" : ""} />
        </Link>
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title={focus ? `Universo de ${focus.name}` : `Universo ${ZONES[zone].label}`}
        figure={
          <>
            {pad(relationships.discovered)}
            <span className="text-2xl text-ink-soft">/{pad(relationships.total)}</span>
          </>
        }
        figureLabel="relaciones"
      >
        <p className="px-4 py-2 text-xs text-ink-soft">
          Elige un protagonista y mira su reparto. Toca a cualquiera para que pase a ser el protagonista.
        </p>
      </PageHeader>

      {!focus ? (
        <p className="mt-6 max-w-prose text-sm text-ink-soft">
          Aún no has descubierto a nadie en {ZONES[zone].label}. Marca un cómic como leído y su reparto
          aparecerá aquí.{" "}
          <Link href="/catalog" className="text-ink underline">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <>
          {/* Elegir protagonista: todo el reparto descubierto, del más conectado al menos. */}
          <nav aria-label="Elegir protagonista" className="mt-6">
            {/* Móvil y tablet: una fila que se desliza. */}
            <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:px-0 lg:hidden">
              {cast.map((c) => thumb(c))}
            </ul>
            {/* Escritorio: una fila con los más conectados y el resto en un desplegable, para que el
                reparto siga en la primera pantalla. */}
            <div className="hidden lg:block">
              <ul className="flex gap-2">{cast.slice(0, DESKTOP_ROW).map((c) => thumb(c))}</ul>
              {cast.length > DESKTOP_ROW && (
                <details open={activeIndex >= DESKTOP_ROW} className="mt-1">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm text-ink underline [&::-webkit-details-marker]:hidden">
                    Ver todo el reparto ({cast.length})
                  </summary>
                  <ul className="flex flex-wrap gap-2">{cast.slice(DESKTOP_ROW).map((c) => thumb(c))}</ul>
                </details>
              )}
            </div>
          </nav>

          {/* key: al cambiar de protagonista el reparto se vuelve a entintar en cascada. */}
          <div
            key={focus.id}
            className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10"
          >
            <section aria-labelledby="protagonist" className="flex gap-4 self-start lg:sticky lg:top-6 lg:flex-col lg:gap-0">
              <Panel card={focus} className="w-28 shrink-0 sm:w-36 lg:w-full" />
              <div className="lg:mt-4">
                <h2 id="protagonist" className="text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
                  {focus.name}
                </h2>
                <p className="font-hand text-xl leading-tight font-bold text-editor-ink">
                  {CARD_STATE_LABELS[focus.state].toLowerCase()}
                </p>
                {focus.realName && <p className="mt-1 text-sm text-ink-soft">{focus.realName}</p>}
                <p className="mt-1 text-sm text-ink">
                  {pluralize(focus.comicsRead, "cómic leído", "cómics leídos")}
                </p>
                <Link href={`/characters/${focus.id}`} className="mt-1 inline-flex min-h-11 items-center text-sm text-ink underline">
                  Ver su ficha
                </Link>
              </div>
            </section>

            {/* Los grupos encajan como viñetas de distinto ancho: cada uno ocupa tantas columnas como
                personajes tiene (hasta llenar la fila). Sin relleno denso: el orden visual es el del
                tabulador. */}
            <div className="flex flex-col gap-8 sm:grid sm:grid-cols-4 sm:items-start sm:gap-x-6 xl:grid-cols-5">
              {groups.length === 0 && (
                <p className="text-sm text-ink-soft sm:col-span-full">
                  Aún no has descubierto a nadie relacionado con {focus.name}.
                </p>
              )}
              {groups.map((group) => (
                <section
                  key={group.key}
                  aria-labelledby={`group-${group.key}`}
                  style={
                    {
                      "--span-sm": Math.min(group.members.length, 4),
                      "--span-xl": Math.min(group.members.length, 5),
                    } as React.CSSProperties
                  }
                  className="sm:col-span-(--span-sm) xl:col-span-(--span-xl)"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b-2 border-ink pb-1">
                    <h3 id={`group-${group.key}`} className="font-hand text-2xl leading-none font-bold text-ink">
                      {GROUP_LABELS[group.key]}
                    </h3>
                    <span className="font-hand text-xl leading-none font-bold text-ink-soft">
                      {group.members.length}
                    </span>
                  </div>
                  {/* Móvil: una fila que se desliza; desde sm, rejilla. */}
                  <ul className="-mx-4 mt-1 flex snap-x gap-3 overflow-x-auto px-4 pt-2 pb-1 scrollbar-none sm:mx-0 sm:mt-3 sm:pt-0 sm:grid sm:grid-cols-[repeat(var(--span-sm),minmax(0,1fr))] sm:gap-4 sm:overflow-visible sm:px-0 xl:grid-cols-[repeat(var(--span-xl),minmax(0,1fr))]">
                    {group.members.map(({ card, shared }, index) => (
                      <li
                        key={card.id}
                        style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                        className="w-28 shrink-0 snap-start motion-safe:animate-pop-in sm:w-auto"
                      >
                        <Link href={`/graph?focus=${card.id}`} className="group flex flex-col">
                          <Panel
                            card={card}
                            className={card.isNew ? "outline-2 outline-offset-4 outline-editor" : ""}
                          />
                          <span className="mt-1.5 text-sm leading-tight font-bold text-ink">{card.name}</span>
                          {(card.isNew || card.state === "COLLECTED") && (
                            <span className="font-hand text-lg leading-tight font-bold text-editor-ink">
                              {card.isNew ? "¡nuevo!" : "coleccionado"}
                            </span>
                          )}
                          <span className="text-xs text-ink-soft">
                            {pluralize(shared, "cómic juntos", "cómics juntos")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              {hidden > 0 && (
                <section aria-labelledby="group-hidden" className="sm:col-span-full">
                  <div className="flex items-baseline justify-between gap-4 border-b-[1.5px] border-blue pb-1">
                    <h3 id="group-hidden" className="font-hand text-3xl leading-none font-bold text-blue-ink">
                      por descubrir
                    </h3>
                    <span className="font-hand text-2xl leading-none font-bold text-blue-ink">{hidden}</span>
                  </div>
                  {/* Solo el número: de un bloqueado no viaja nada más. */}
                  <ul aria-hidden="true" className="mt-3 grid grid-cols-6 gap-2 sm:gap-4">
                    {Array.from({ length: Math.min(hidden, MAX_HIDDEN_PANELS) }, (_, i) => (
                      <li key={i} className="relative aspect-3/4 border-[1.5px] border-blue bg-sheet">
                        <svg viewBox="0 0 30 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-blue">
                          <path d="M0 0 30 40M30 0 0 40" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        </svg>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-ink-soft">
                    {focus.name} tiene {pluralize(hidden, "relación", "relaciones")} con personajes que aún no
                    has descubierto. Sigue leyendo para entintarlos.
                  </p>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
