"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inkButton, inkField } from "@/components/ui/page-parts";

/** Nombre de usuario y perfil público (privado por defecto). */
export function ProfileSettingsForm({ handle, isPublic }: { handle: string | null; isPublic: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "taken" | "invalid" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("saving");
    const response = await fetch("/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: form.get("handle"), isPublic: form.get("isPublic") === "on" }),
    }).catch(() => null);
    if (!response) return setState("error");
    if (response.status === 409) return setState("taken");
    if (response.status === 400) return setState("invalid");
    if (!response.ok) return setState("error");
    setState("saved");
    router.refresh();
  }

  const messages = {
    taken: "Ese nombre de usuario ya está cogido. Prueba con otro.",
    invalid: "Entre 3 y 20 caracteres: letras sin acentos, números, - o _.",
    error: "No se ha podido guardar. Inténtalo de nuevo.",
  } as const;

  return (
    <form onSubmit={submit} className="mt-6 flex max-w-md flex-col gap-4 border-2 border-ink bg-sheet p-5">
      <h2 className="text-lg font-extrabold text-ink">Perfil público</h2>
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
        Nombre de usuario
        <span className="flex items-stretch">
          <span className="flex items-center border-2 border-r-0 border-ink bg-sheet-raised px-3 text-sm font-normal text-ink-soft">
            /u/
          </span>
          <input
            name="handle"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_-]{3,20}"
            defaultValue={handle ?? ""}
            autoComplete="username"
            className={`${inkField} min-w-0 flex-1 font-normal`}
          />
        </span>
      </label>
      <label className="flex min-h-11 items-start gap-3 text-sm text-ink">
        <input type="checkbox" name="isPublic" defaultChecked={isPublic} className="mt-0.5 h-5 w-5 accent-[var(--ink)]" />
        <span>
          <span className="font-semibold">Hacer mi perfil público</span>
          <span className="block text-ink-soft">
            Otros lectores verán tus álbumes (solo el progreso), tus últimas lecturas y las reseñas que marques como
            públicas. Nunca tu correo.
          </span>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === "saving"} className={inkButton}>
          {state === "saving" ? "Guardando…" : "Guardar"}
        </button>
        {handle && (
          <Link href={`/u/${handle}`} className="inline-flex min-h-11 items-center text-sm text-ink underline">
            Ver mi perfil
          </Link>
        )}
      </div>
      {state === "saved" && (
        <p role="status" className="text-sm text-ink">
          Guardado.
        </p>
      )}
      {(state === "taken" || state === "invalid" || state === "error") && (
        <p role="alert" className="text-sm text-danger">
          {messages[state]}
        </p>
      )}
    </form>
  );
}
