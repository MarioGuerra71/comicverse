import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { DiscoveryItem } from "@/components/characters/discovery-item";
import { requireUser } from "@/server/auth/session";
import { listDiscoveries } from "@/server/services/dashboard";
import { discoveriesSearchSchema } from "@/server/validation/discoveries";

export const metadata: Metadata = { title: "Descubrimientos · ComicVerse" };

const hrefFor = (page: number) => (page > 1 ? `/discoveries?page=${page}` : "/discoveries");

export default async function DiscoveriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const parsed = discoveriesSearchSchema.safeParse(normalizeParams(await searchParams));
  const input = parsed.success ? parsed.data : discoveriesSearchSchema.parse({});
  const result = await listDiscoveries(db, user.id, input);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/dashboard" className="text-sm underline">
        ← Volver al inicio
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Descubrimientos</h1>
      <p className="mt-1 text-sm opacity-70">
        Cada personaje que has desbloqueado y el cómic con el que lo descubriste.
      </p>

      {result.items.length === 0 ? (
        <p className="mt-6 text-sm opacity-80">
          Aún no has descubierto a nadie.{" "}
          <Link href="/catalog" className="underline">
            Marca un cómic como leído
          </Link>{" "}
          para empezar.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.items.map((discovery, index) => (
            <li key={`${discovery.character.id}-${discovery.discoveredAt}-${index}`}>
              <DiscoveryItem discovery={discovery} />
            </li>
          ))}
        </ul>
      )}

      {result.totalPages > 1 && (
        <nav aria-label="Paginación" className="mt-8 flex items-center justify-between text-sm">
          {result.page > 1 ? (
            <Link href={hrefFor(result.page - 1)} className="underline">
              ← Más recientes
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="opacity-70">
            Página {result.page} de {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Link href={hrefFor(result.page + 1)} className="underline">
              Más antiguos →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      )}
    </main>
  );
}
