import { db } from "@/lib/db";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { syncNewReleases } from "@/server/jobs/sync-new-releases";

// Unas decenas de peticiones a Comic Vine con 1,1 s de pausa entre ellas.
export const maxDuration = 300;

/**
 * Tarea diaria de Vercel Cron (vercel.json). Vercel la llama con
 * `Authorization: Bearer <CRON_SECRET>`; sin ese secreto configurado, no se ejecuta nunca.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const client = getComicVineClient();
  if (!client) return Response.json({ error: "COMIC_VINE_DISABLED" }, { status: 503 });

  const summary = await syncNewReleases(db, client);
  console.log("Novedades sincronizadas", summary);
  return Response.json(summary);
}
