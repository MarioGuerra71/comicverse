import { randomBytes, randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEMO_EMAIL_DOMAIN } from "@/lib/demo";
import { isRateLimited, LIMITS } from "@/server/rate-limit";
import { purgeExpiredDemos, seedDemoAccount } from "@/server/services/demo";

// Marcar los cómics de la demo es una transacción de unos cientos de escrituras.
export const maxDuration = 30;

/**
 * POST /api/v1/demo (sin sesión): crea una cuenta de demo con unos cómics ya leídos y deja la
 * sesión iniciada (la cookie viene en la respuesta). Cada visitante tiene la suya; se borra a las 24 h.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (await isRateLimited(db, `demo:${ip}`, LIMITS.demo)) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  // Aprovechamos cada demo nueva para borrar las caducadas (no hace falta otro cron).
  await purgeExpiredDemos(db);

  const { headers, response } = await auth.api.signUpEmail({
    body: {
      name: "Lector demo",
      email: `${randomUUID()}@${DEMO_EMAIL_DOMAIN}`,
      // Nadie la necesita: la sesión ya viene en la cookie y la cuenta caduca sola.
      password: randomBytes(24).toString("base64url"),
    },
    returnHeaders: true,
  });

  await seedDemoAccount(db, response.user.id);

  return new Response(null, { status: 204, headers: { "set-cookie": headers.get("set-cookie") ?? "" } });
}
