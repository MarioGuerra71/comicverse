import { pickConstellations, skyPosition } from "@/lib/sky-layout";

const W = 1000;
const H = 360;
const CX = W / 2;
const CY = H / 2;
const RX = W * 0.49;
const RY = H * 0.47;

export interface SkyStar {
  id: string;
  number: number;
  name: string;
  comicsRead: number;
  collected: boolean;
  isNew: boolean;
}

/** Brillo según lo leído: cada cómic leído agranda la estrella hasta "coleccionado". */
const radiusFor = (star: SkyStar) => 7 + Math.min(star.comicsRead, 5) * 1.6;

/** Graduación del borde de la carta, como en los atlas grabados: 120 marcas, una larga cada 10. */
const TICKS = Array.from({ length: 120 }, (_, k) => {
  const a = (k / 120) * Math.PI * 2;
  const len = k % 10 === 0 ? 14 : 6;
  return {
    x1: CX + RX * Math.cos(a),
    y1: CY + RY * Math.sin(a),
    x2: CX + (RX - len) * Math.cos(a),
    y2: CY + (RY - len * (RY / RX)) * Math.sin(a),
  };
});

/**
 * "Tu cielo": una carta celeste grabada con una posición por número de catálogo.
 * Descubiertos = estrellas (más grandes cuanto más leídos); coleccionados en dorado;
 * recién descubiertos con un aro dorado. Constelaciones = relaciones curadas descubiertas
 * (las de "aparecen juntos" están en "Universo": aquí formarían una maraña).
 * Bloqueados = puntos apagados, sin enlace ni nombre. SVG del servidor, sin JavaScript.
 */
export function Sky({
  total,
  stars,
  lockedNumbers,
  constellations,
}: {
  total: number;
  stars: SkyStar[];
  lockedNumbers: number[];
  constellations: { a: string; b: string; curated: boolean; shared: number }[];
}) {
  const at = (number: number) => {
    const p = skyPosition(number, total);
    return { x: p.x * W, y: p.y * H };
  };
  const byId = new Map(stars.map((s) => [s.id, at(s.number)]));
  const lines = pickConstellations(constellations.filter((c) => c.curated));

  // Rótulos (solo escritorio) para las más destacadas: a la derecha de la estrella; si ahí
  // tapan otra estrella, a la izquierda; si chocan en los dos lados, sin rótulo.
  const labels = new Map<string, { x: number; anchor: "start" | "end" }>();
  for (const s of stars) {
    if (!(s.collected || s.isNew || s.comicsRead >= 3)) continue;
    const p = byId.get(s.id)!;
    const width = s.name.length * 9;
    const gap = radiusFor(s) + 8;
    const blocked = (from: number, to: number) =>
      stars.some((o) => {
        if (o.id === s.id) return false;
        const q = byId.get(o.id)!;
        return q.x > from - 12 && q.x < to + 12 && Math.abs(q.y - p.y) < 20;
      });
    if (!blocked(p.x + gap, p.x + gap + width)) labels.set(s.id, { x: p.x + gap, anchor: "start" });
    else if (!blocked(p.x - gap - width, p.x - gap)) labels.set(s.id, { x: p.x - gap, anchor: "end" });
  }

  return (
    <figure className="overflow-hidden rounded-md border border-line bg-plate/40">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="group"
        aria-label={`Tu cielo: ${stars.length} de ${total} personajes descubiertos`}
      >
        <g aria-hidden="true" fill="none" stroke="var(--line)" strokeWidth={1} vectorEffect="non-scaling-stroke">
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} stroke="var(--line-strong)" />
          {TICKS.map((t, k) => (
            <line key={k} {...t} />
          ))}
          <ellipse cx={CX} cy={CY} rx={RX * 0.5} ry={RY * 0.5} strokeDasharray="2 6" />
          <path d={`M ${W * 0.02} ${H * 0.62} Q ${CX} ${H * 0.18} ${W * 0.98} ${H * 0.4}`} strokeDasharray="2 6" />
        </g>

        <g aria-hidden="true">
          {lines.map(({ a, b }) => {
            const p = byId.get(a);
            const q = byId.get(b);
            if (!p || !q) return null;
            return (
              <line
                key={`${a}-${b}`}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                stroke="var(--line-strong)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {lockedNumbers.map((number) => {
            const p = at(number);
            return <circle key={number} cx={p.x} cy={p.y} r={4} fill="var(--line-strong)" />;
          })}
        </g>

        {stars.map((star) => {
          const p = at(star.number);
          const r = radiusFor(star);
          return (
            // En el móvil las estrellas quedan demasiado juntas para tocarlas: solo se
            // pueden pulsar desde md; las cartas de debajo llevan los mismos enlaces.
            <a
              key={star.id}
              href={`/characters/${star.id}`}
              aria-label={star.isNew ? `${star.name} (nuevo)` : star.name}
              className="group pointer-events-none md:pointer-events-auto"
            >
              <title>{star.name}</title>
              <circle cx={p.x} cy={p.y} r={34} fill="transparent" />
              {star.isNew && (
                // Trazo de grosor fijo en pantalla: se ve igual en el móvil que en escritorio.
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 14}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth={2.5}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={star.collected ? "var(--gold)" : "var(--star)"}
                className="transition-transform duration-200 transform-fill origin-center group-hover:scale-125 group-focus-visible:scale-125"
              />
              {labels.has(star.id) && (
                // Halo del color del fondo detrás del texto: las líneas no lo tachan.
                <text
                  x={labels.get(star.id)!.x}
                  y={p.y + 6}
                  textAnchor={labels.get(star.id)!.anchor}
                  className="hidden font-display md:block"
                  fontSize={17}
                  fill="var(--dim)"
                  stroke="var(--night)"
                  strokeWidth={6}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  {star.name}
                </text>
              )}
            </a>
          );
        })}
      </svg>
    </figure>
  );
}
