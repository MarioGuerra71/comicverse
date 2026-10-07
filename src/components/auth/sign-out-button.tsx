"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { SignOutIcon } from "@/components/ui/icons";

export function SignOutButton({
  className = "",
  showLabel = false,
}: {
  className?: string;
  /** Texto siempre visible (en la barra lateral solo se ve en escritorio). */
  showLabel?: boolean;
}) {
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Cerrar sesión"
      className={`flex min-h-11 items-center gap-3 border-2 border-transparent px-3 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink ${className}`}
    >
      <SignOutIcon />
      <span className={showLabel ? "" : "sr-only lg:not-sr-only"}>Cerrar sesión</span>
    </button>
  );
}
