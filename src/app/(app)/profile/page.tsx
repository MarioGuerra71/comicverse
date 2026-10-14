import type { Metadata } from "next";
import { db } from "@/lib/db";
import { HandleEditor, VisibilitySwitch } from "@/components/social/profile-settings-form";
import { getProfileSettings } from "@/server/services/social";
import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHeader, SectionHeading } from "@/components/ui/page-parts";

export const metadata: Metadata = { title: "Perfil · ComicVerse" };

export default async function ProfilePage() {
  const user = await requireUser();
  const settings = await getProfileSettings(db, user.id);
  const memberSince = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(user.createdAt);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title={user.name}>
        <p className="px-4 py-2 text-xs text-ink-soft">
          {settings?.handle ? `/u/${settings.handle} · ` : ""}miembro desde {memberSince}
        </p>
      </PageHeader>

      <section aria-labelledby="public-heading" className="mt-8">
        <SectionHeading id="public-heading" title="Tu perfil en la comunidad" />
        <div className="mt-4 flex flex-col gap-4">
          <VisibilitySwitch isPublic={settings?.isPublic ?? true} />
          {settings?.handle && <HandleEditor handle={settings.handle} />}
        </div>
      </section>

      <section aria-labelledby="account-heading" className="mt-10">
        <SectionHeading id="account-heading" title="Tu cuenta" />
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm text-ink">
          <dt className="text-ink-soft">Nombre</dt>
          <dd>{user.name}</dd>
          <dt className="text-ink-soft">Correo</dt>
          <dd className="break-all">
            {user.email} <span className="text-ink-soft">(nunca se muestra a otros)</span>
          </dd>
        </dl>
        <SignOutButton showLabel className="mt-6 -ml-3" />
      </section>
    </main>
  );
}
