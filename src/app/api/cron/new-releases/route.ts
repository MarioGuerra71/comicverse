import { db } from "@/lib/db";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { syncNewReleases } from "@/server/jobs/sync-new-releases";
import { importRelationships } from "@/server/jobs/import-relationships";
import relationshipsFile from "../../../../../data/relationships.json";

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
  // Relaciones curadas: las de personajes que acaban de llegar (p. ej. de DC) entran ahora.
  const relationships = await importRelationships(db, relationshipsFile);
  console.log("Novedades sincronizadas", summary, "relaciones", relationships.imported);
  return Response.json({ ...summary, relationships: relationships.imported });
}
