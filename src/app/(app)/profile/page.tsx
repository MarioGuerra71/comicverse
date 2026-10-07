import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHeader } from "@/components/ui/page-parts";

export default async function ProfilePage() {
  const user = await requireUser();
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
      <SignOutButton showLabel className="mt-8 -ml-3" />
    </main>
  );
}