import { requireUser } from "@/server/auth/session";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Hola, {user.name}</h1>
      <p className="mt-2 opacity-70">
        Aquí aparecerá el progreso de tu universo.
      </p>
    </main>
  );
}