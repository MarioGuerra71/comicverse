"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inkButton, inkField } from "@/components/ui/page-parts";
import { authErrorMessage } from "@/lib/auth-errors";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    setLoading(false);
    if (res.error) {
      setError(authErrorMessage(res.error, "No se pudo crear la cuenta."));
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Crear cuenta</h1>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Nombre
          <input
            name="name"
            required
            autoComplete="name"
            className={`${inkField} font-normal`}
          />
        </label>
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
          Contraseña (mínimo 8 caracteres)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={`${inkField} font-normal`}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className={inkButton}
        >
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link href="/sign-in" className="text-ink underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}