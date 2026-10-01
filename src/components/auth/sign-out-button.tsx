"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-md border border-foreground/20 px-4 py-2 text-sm"
    >
      Cerrar sesión
    </button>
  );
}