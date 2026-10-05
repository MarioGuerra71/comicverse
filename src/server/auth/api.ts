import "server-only";
import { auth } from "@/lib/auth";

/** Devuelve el usuario de la sesión de una petición de API, o null. */
export async function getApiUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export function unauthorized() {
  return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

export function badRequest(error: string, issues?: { path: string; message: string }[]) {
  return Response.json({ error, ...(issues ? { issues } : {}) }, { status: 400 });
}