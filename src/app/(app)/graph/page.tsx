import { ZONES } from "@/lib/zones";
import { getZone } from "@/server/zone";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pluralize } from "@/lib/format";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { UniverseGraph } from "@/components/graph/universe-graph";
import { RelationshipList } from "@/components/graph/relationship-list";
import { inkTab, PageHeader } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getGraph } from "@/server/services/discovery";
import { graphSearchSchema } from "@/server/validation/graph";

export const metadata: Metadata = { title: "Universo descubierto · ComicVerse" };

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const parsed = graphSearchSchema.safeParse(normalizeParams(await searchParams));
  if (!parsed.success) notFound();

  // Con focus bloqueado o inexistente: 404, igual que su ficha.
  const zone = await getZone();
  const graph = await getGraph(db, user.id, parsed.data.focus, zone);
  if (!graph) notFound();

  const focusName = graph.nodes.find((n) => n.id === graph.focus)?.name;
  const { view } = parsed.data;
  const hrefFor = (nextView: "graph" | "list") => {
    const query = new URLSearchParams();
    if (graph.focus) query.set("focus", graph.focus);
    if (nextView === "list") query.set("view", "list");
    const queryString = query.toString();
    return queryString ? `/graph?${queryString}` : "/graph";
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title={focusName ? `Universo de ${focusName}` : `Universo ${ZONES[zone].label}`}
        figure={focusName ? undefined : graph.edges.length}
        figureLabel="relaciones"
      >
      <p className="px-4 py-2 text-xs text-ink-soft">
        {focusName ? (
          <>
            {/* Sus relaciones = sus vecinos (el subgrafo también une a los vecinos entre sí). */}
            {pluralize(graph.nodes.length - 1, "relación descubierta", "relaciones descubiertas")}
            {graph.hiddenRelationships > 0 &&
              ` y ${pluralize(graph.hiddenRelationships, "por descubrir", "por descubrir")}`}
            .{" "}
            <Link href={view === "list" ? "/graph?view=list" : "/graph"} className="text-ink underline">
              Ver todo el universo
            </Link>
          </>
        ) : (
          <>
            {graph.progress.unlocked} de {graph.progress.total} personajes descubiertos.
          </>
        )}{" "}
        {view === "graph" &&
          "Toca un personaje para abrir su ficha. Línea continua: relación con nombre (aliado, enemigo…); discontinua: aparecen juntos a menudo."}
      </p>
      </PageHeader>

      <nav aria-label="Forma de ver el universo" className="mt-6 flex gap-2">
        {(["graph", "list"] as const).map((v) => (
          <Link
            key={v}
            href={hrefFor(v)}
            aria-current={view === v ? "page" : undefined}
            className={inkTab(view === v)}
          >
            {v === "graph" ? "Grafo" : "Lista"}
          </Link>
        ))}
      </nav>

      {graph.nodes.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Tu universo aún está vacío. Marca un cómic como leído para descubrir a sus
          personajes.{" "}
          <Link href="/catalog" className="text-ink underline">
            Ir al catálogo
          </Link>
        </p>
      ) : view === "list" ? (
        <RelationshipList data={graph} />
      ) : (
        <div className="mt-4 h-[70vh] min-h-96 w-full overflow-hidden border-2 border-ink bg-sheet">
          {/* key: al cambiar de foco se recalcula el encuadre (fitView). */}
          <UniverseGraph key={graph.focus ?? "all"} data={graph} />
        </div>
      )}
    </main>
  );
}
