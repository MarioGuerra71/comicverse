"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inkTab } from "@/components/ui/page-parts";

export function FollowButton({ handle, following }: { handle: string; following: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState(false);

  async function toggle() {
    setBusy(true);
    setError(false);
    const response = await fetch(`/api/v1/users/${handle}/follow`, { method: following ? "DELETE" : "PUT" }).catch(
      () => null,
    );
    setBusy(false);
    if (!response?.ok) return setError(true);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <button
        type="button"
        aria-pressed={following}
        disabled={busy || refreshing}
        onClick={toggle}
        className={`${inkTab(following)} disabled:opacity-50`}
      >
        {following ? "Siguiendo" : "Seguir"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          No se ha podido guardar. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
