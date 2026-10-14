import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { inkButton, inkField, PageHeader, SectionHeading } from "@/components/ui/page-parts";
import { requireUser } from "@/server/auth/session";
import { getProfileSettings, listCommunity } from "@/server/services/social";
import { communitySearchSchema } from "@/server/validation/social";

export const metadata: Metadata = { title: "Comunidad · ComicVerse" };

function ProfileLink({ user }: { user: { name: string; handle: string | null } }) {
  return (
    <li>
      <Link
        href={`/u/${user.handle}`}
        className="flex min-h-11 items-center gap-3 border-2 border-ink bg-sheet p-3 transition-colors hover:bg-sheet-raised"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink font-bold text-ink">
          {user.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-ink">{user.name}</span>
          <span className="block truncate text-xs text-ink-soft">/u/{user.handle}</span>
        </span>
      </Link>
    </li>
  );
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const parsed = communitySearchSchema.safeParse(normalizeParams(await searchParams));
  const q = parsed.success ? parsed.data.q : undefined;
  const [{ profiles, following }, settings] = await Promise.all([
    listCommunity(db, user.id, q),
    getProfileSettings(db, user.id),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Comunidad">
        <p className="px-4 py-2 text-xs text-ink-soft">
          Lectores con perfil público. Compara tus álbumes con los suyos (sin spoilers: solo cifras).
        </p>
      </PageHeader>

      {!settings?.isPublic && (
        <p className="mt-6 max-w-prose text-sm text-ink-soft">
          Tu perfil es privado: nadie te ve aquí.{" "}
          <Link href="/profile" className="text-ink underline">
            Hazlo público en tu perfil
          </Link>{" "}
          si quieres que otros lectores te encuentren.
        </p>
      )}

      {following.length > 0 && (
        <section aria-labelledby="following" className="mt-10">
          <SectionHeading id="following" title="A quién sigues" />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {following.map((u) => (
              <ProfileLink key={u.id} user={u} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="profiles" className="mt-10">
        <SectionHeading id="profiles" title="Lectores" />
        <form method="get" role="search" className="mt-4 flex max-w-md">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o usuario"
            aria-label="Buscar lectores"
            className={`${inkField} min-w-0 flex-1`}
          />
          <button type="submit" className={inkButton}>
            Buscar
          </button>
        </form>
        {profiles.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            {q ? "Nadie con ese nombre." : "Todavía no hay más lectores con perfil público."}
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((u) => (
              <ProfileLink key={u.id} user={u} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
