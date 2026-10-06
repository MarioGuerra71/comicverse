import Link from "next/link";
import { pluralize } from "@/lib/format";
import { RELATIONSHIP_TYPE_LABELS } from "@/lib/relationship-types";
import type { GraphData } from "@/components/graph/universe-graph";

/**
 * Vista en lista del grafo (accesible: títulos y listas que un lector de pantalla recorre).
 * Con focus solo aparece ese personaje; sin focus, todos los descubiertos por nombre.
 */
export function RelationshipList({ data }: { data: GraphData }) {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const people = data.focus
    ? data.nodes.filter((n) => n.id === data.focus)
    : [...data.nodes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ul className="mt-4 flex flex-col gap-6">
      {people.map((person) => {
        // Sus relaciones descubiertas: primero las curadas (con tipo), luego por cómics juntos.
        const relations = data.edges
          .filter((e) => e.source === person.id || e.target === person.id)
          .map((e) => ({ ...e, other: byId.get(e.source === person.id ? e.target : e.source)! }))
          .sort((a, b) => Number(!!b.type) - Number(!!a.type) || b.shared - a.shared);

        return (
          <li key={person.id}>
            <h2 className="font-semibold">
              <Link href={`/characters/${person.id}`} className="underline">
                {person.name}
              </Link>
            </h2>
            {relations.length === 0 ? (
              <p className="mt-1 text-sm opacity-70">Aún sin relaciones descubiertas.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {relations.map((r) => (
                  <li key={r.other.id}>
                    <Link href={`/characters/${r.other.id}`} className="underline">
                      {r.other.name}
                    </Link>
                    {r.type && ` · ${RELATIONSHIP_TYPE_LABELS[r.type]}`}
                    {r.shared > 0 && (
                      <span className="opacity-60">
                        {" "}
                        · {pluralize(r.shared, "cómic juntos", "cómics juntos")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
