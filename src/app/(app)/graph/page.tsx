import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pluralize } from "@/lib/format";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { UniverseGraph } from "@/components/graph/universe-graph";
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
  const graph = await getGraph(db, user.id, parsed.data.focus);
  if (!graph) notFound();

  const focusName = graph.nodes.find((n) => n.id === graph.focus)?.name;

  return (
    <main className="mx-auto flex max-w-6xl flex-col p-6">
      <h1 className="text-2xl font-bold">
        {focusName ? `Universo de ${focusName}` : "Universo descubierto"}
      </h1>
      <p className="mt-1 text-sm opacity-80">
        {focusName ? (
          <>
            {/* Sus relaciones = sus vecinos (el subgrafo también une a los vecinos entre sí). */}
            {pluralize(graph.nodes.length - 1, "relación descubierta", "relaciones descubiertas")}
            {graph.hiddenRelationships > 0 &&
              ` y ${pluralize(graph.hiddenRelationships, "por descubrir", "por descubrir")}`}
            .{" "}
            <Link href="/graph" className="underline">
              Ver todo el grafo
            </Link>
          </>
        ) : (
          <>
            {graph.progress.unlocked} / {graph.progress.total} personajes ·{" "}
            {graph.edges.length} relaciones descubiertas.
          </>
        )}{" "}
        Toca un personaje para abrir su ficha. Línea continua: relación con nombre (aliado,
        enemigo…); discontinua: aparecen juntos a menudo.
      </p>

      {graph.nodes.length === 0 ? (
        <p className="mt-6 text-sm opacity-80">
          Tu universo aún está vacío. Marca un cómic como leído para descubrir a sus
          personajes.{" "}
          <Link href="/catalog" className="underline">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <div className="mt-4 h-[70vh] min-h-96 w-full overflow-hidden rounded-md border border-foreground/20">
          {/* key: al cambiar de foco se recalcula el encuadre (fitView). */}
          <UniverseGraph key={graph.focus ?? "all"} data={graph} />
        </div>
      )}
    </main>
  );
}
