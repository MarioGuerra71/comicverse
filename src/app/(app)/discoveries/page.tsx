import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { DiscoveryItem } from "@/components/characters/discovery-item";
import { PageHeader, Pagination } from "@/components/ui/page-parts";
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
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/dashboard" className="text-sm text-ink underline">
        ← Volver al inicio
      </Link>
      <div className="mt-4">
        <PageHeader title="Descubrimientos" figure={result.total} figureLabel="personajes">
          <p className="px-4 py-2 text-xs text-ink-soft">
            Cada personaje que has entintado y el cómic con el que lo descubriste.
          </p>
        </PageHeader>
      </div>

      {result.items.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Aún no has descubierto a nadie.{" "}
          <Link href="/catalog" className="text-ink underline">
            Marca un cómic como leído
          </Link>{" "}
          para empezar.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {result.items.map((discovery, index) => (
            <li key={`${discovery.character.id}-${discovery.discoveredAt}-${index}`}>
              <DiscoveryItem discovery={discovery} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
    </main>
  );
}
