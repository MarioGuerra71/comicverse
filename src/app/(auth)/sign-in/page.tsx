"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Correo electrónico
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-sm">
        ¿No tienes cuenta?{" "}
        <Link href="/sign-up" className="underline">
          Regístrate
        </Link>
      </p>
    </main>
  );
}