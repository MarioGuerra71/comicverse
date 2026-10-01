import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-foreground/10 px-6 py-3">
        <Link href="/dashboard" className="font-bold">
          ComicVerse
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/profile" className="underline-offset-4 hover:underline">
            {user.name}
          </Link>
          <SignOutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}