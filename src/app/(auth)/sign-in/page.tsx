"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inkButton, inkField } from "@/components/ui/page-parts";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "No se pudo iniciar sesión.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Iniciar sesión</h1>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Correo electrónico
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`${inkField} font-normal`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Contraseña
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={`${inkField} font-normal`}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className={inkButton}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-ink-soft">
        ¿No tienes cuenta?{" "}
        <Link href="/sign-up" className="text-ink underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}