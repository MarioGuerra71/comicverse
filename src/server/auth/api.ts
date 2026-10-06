import "server-only";
import type { z } from "zod";
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

/** Lee el JSON del cuerpo y lo valida; devuelve los datos o una respuesta 400. */
export async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: badRequest("INVALID_JSON") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: badRequest(
        "INVALID_BODY",
        parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      ),
    };
  }
  return { data: parsed.data };
}
