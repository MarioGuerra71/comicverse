import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { UniverseGraph } from "@/components/graph/universe-graph";
import { requireUser } from "@/server/auth/session";
import { getGraph } from "@/server/services/discovery";

export const metadata: Metadata = { title: "Universo descubierto · ComicVerse" };

export default async function GraphPage() {
  const user = await requireUser();
  const graph = await getGraph(db, user.id);

  return (
    <main className="mx-auto flex max-w-6xl flex-col p-6">
      <h1 className="text-2xl font-bold">Universo descubierto</h1>
      <p className="mt-1 text-sm opacity-80">
        {graph.progress.unlocked} / {graph.progress.total} personajes ·{" "}
        {graph.edges.length} relaciones descubiertas. Línea continua: relación con nombre
        (aliado, enemigo…); discontinua: aparecen juntos a menudo.
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
          <UniverseGraph data={graph} />
        </div>
      )}
    </main>
  );
}
