import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelMark } from "@/components/ui/icons";
import { getSession } from "@/server/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  // El formulario va dentro de una viñeta entintada, bajo la marca.
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-extrabold text-ink">
          <PanelMark size={24} />
          ComicVerse
        </Link>
        <div className="mt-4 border-2 border-ink bg-sheet p-6">{children}</div>
      </div>
    </main>
  );
}
