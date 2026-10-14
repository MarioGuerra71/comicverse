import Link from "next/link";
import { db } from "@/lib/db";
import { ProfileSettingsForm } from "@/components/social/profile-settings-form";
import { getProfileSettings } from "@/server/services/social";
import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHeader } from "@/components/ui/page-parts";

export default async function ProfilePage() {
  const user = await requireUser();
  const settings = await getProfileSettings(db, user.id);
  const memberSince = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
  }).format(user.createdAt);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Perfil" />
      <dl className="mt-6 space-y-3 text-sm text-ink">
        <div>
          <dt className="text-ink-soft">Nombre</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Correo electrónico</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Miembro desde</dt>
          <dd>{memberSince}</dd>
        </div>
      </dl>
      <ProfileSettingsForm handle={settings?.handle ?? null} isPublic={settings?.isPublic ?? false} />
      <div className="mt-6 flex flex-wrap gap-x-6">
        <Link href="/achievements" className="inline-flex min-h-11 items-center text-sm text-ink underline">
          Tus logros
        </Link>
        <Link href="/community" className="inline-flex min-h-11 items-center text-sm text-ink underline">
          Comunidad
        </Link>
      </div>
      <SignOutButton showLabel className="mt-4 -ml-3" />
    </main>
  );
}