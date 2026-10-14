"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HANDLE_PATTERN, normalizeHandle } from "@/lib/handles";
import { inkButton } from "@/components/ui/page-parts";

async function patch(body: object) {
  return fetch("/api/v1/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
}

/** Interruptor público/privado: guarda al tocarlo. */
export function VisibilitySwitch({ isPublic }: { isPublic: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(isPublic);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    const next = !value;
    setValue(next); // optimista: se ve el cambio al instante
    setBusy(true);
    setError(false);
    const response = await patch({ isPublic: next });
    setBusy(false);
    if (!response?.ok) {
      setValue(!next);
      setError(true);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={busy}
        onClick={toggle}
        className="flex w-full items-center gap-4 rounded-2xl border border-edge bg-sheet p-4 text-left transition-colors hover:bg-sheet-raised disabled:opacity-70"
      >
        {/* El interruptor: tinta llena = público. */}
        <span
          aria-hidden="true"
          className={`relative h-8 w-14 shrink-0 rounded-full border border-edge transition-colors ${value ? "bg-editor shadow-[0_0_14px_var(--glow)]" : "bg-paper"}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-ink transition-all duration-200 ${
              value ? "left-[calc(100%-1.5rem)]" : "left-0.5"
            }`}
          />
        </span>
        <span>
          <span className="block font-extrabold text-ink">{value ? "Perfil público" : "Perfil privado"}</span>
          <span className="block text-sm text-ink-soft">
            {value
              ? "Otros lectores pueden encontrarte, seguirte y comparar sus álbumes con los tuyos."
              : "Nadie más ve tu perfil ni te encuentra en la comunidad."}
          </span>
        </span>
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          No se ha podido cambiar. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}

type Check = "idle" | "checking" | "free" | "taken" | "invalid";

/** Nombre de usuario: se corrige mientras escribes, muestra la dirección y avisa si está libre. */
export function HandleEditor({ handle }: { handle: string }) {
  const router = useRouter();
  const [value, setValue] = useState(handle);
  const [check, setCheck] = useState<Check>("idle");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const changed = value !== handle;

  // Comprueba si está libre 400 ms después de dejar de escribir.
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!changed) return;
    if (!HANDLE_PATTERN.test(value)) {
      timer.current = window.setTimeout(() => setCheck("invalid"), 0);
      return;
    }
    timer.current = window.setTimeout(async () => {
      setCheck("checking");
      const response = await fetch(`/api/v1/profile/handle?value=${encodeURIComponent(value)}`).catch(() => null);
      const data = response?.ok ? ((await response.json()) as { available: boolean }) : null;
      setCheck(data ? (data.available ? "free" : "taken") : "idle");
    }, 400);
    return () => window.clearTimeout(timer.current);
  }, [value, changed]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaved("saving");
    const response = await patch({ handle: value });
    if (response?.status === 409) {
      setCheck("taken");
      return setSaved("idle");
    }
    if (!response?.ok) return setSaved("error");
    setSaved("saved");
    setCheck("idle");
    router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/u/${handle}`).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const status: Record<Check, { text: string; className: string } | null> = {
    idle: null,
    checking: { text: "Comprobando…", className: "text-ink-soft" },
    free: { text: "¡Está libre!", className: "font-hand text-lg font-bold text-ink" },
    taken: { text: "Ya lo tiene otro lector. Prueba con otro.", className: "text-danger" },
    invalid: { text: "Mínimo 3 caracteres.", className: "text-danger" },
  };
  const shown = changed ? status[check] : null;

  return (
    <form onSubmit={save} className="rounded-2xl border border-edge bg-sheet p-4">
      <label htmlFor="handle" className="block font-extrabold text-ink">
        Nombre de usuario
      </label>
      <p className="mt-0.5 text-sm text-ink-soft">Es la dirección de tu perfil. Solo letras, números y guiones.</p>
      <div className="mt-3 flex items-stretch rounded-xl border border-edge bg-paper focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-editor">
        <span className="flex items-center pl-3 text-sm text-ink-soft select-none">/u/</span>
        <input
          id="handle"
          value={value}
          onChange={(e) => {
            setValue(normalizeHandle(e.target.value.replace(/ /g, "-")));
            setSaved("idle");
          }}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-base font-semibold text-ink outline-none"
        />
      </div>
      <p aria-live="polite" className={`mt-2 min-h-5 text-sm ${shown?.className ?? ""}`}>
        {shown?.text ?? (saved === "saved" ? "Guardado." : saved === "error" ? "No se ha podido guardar." : "")}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {changed ? (
          <>
            <button type="submit" disabled={check !== "free" || saved === "saving"} className={inkButton}>
              {saved === "saving" ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={() => setValue(handle)} className="min-h-11 px-2 text-sm text-ink underline">
              Deshacer
            </button>
          </>
        ) : (
          <>
            <Link href={`/u/${handle}`} className={inkButton}>
              Ver mi perfil
            </Link>
            <button type="button" onClick={copy} className="min-h-11 px-2 text-sm text-ink underline">
              {copied ? "¡Enlace copiado!" : "Copiar enlace"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
