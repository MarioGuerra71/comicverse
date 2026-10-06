import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function ProfilePage() {
  const user = await requireUser();
  const memberSince = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
  }).format(user.createdAt);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="opacity-60">Nombre</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt className="opacity-60">Correo electrónico</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt className="opacity-60">Miembro desde</dt>
          <dd>{memberSince}</dd>
        </div>
      </dl>
      <SignOutButton showLabel className="mt-8 -ml-3" />
    </main>
  );
}