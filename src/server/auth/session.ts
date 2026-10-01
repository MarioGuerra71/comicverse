import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Devuelve la sesión actual, o null si no hay.
// cache() evita consultar la base de datos varias veces en una misma petición.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// Para páginas privadas: devuelve el usuario o redirige al login.
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}