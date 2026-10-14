import { db } from "@/lib/db";
import { getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { ensureBatchReady } from "@/server/jobs/sync-comic-characters";
import { syncAchievements } from "@/server/services/achievements";
import { ComicNotFoundError, setComicsStatus } from "@/server/services/library";
import { bulkStatusSchema } from "@/server/validation/library";

// Antes de marcar como leídos se traen de Comic Vine los personajes que falten (~1 s por cómic).
export const maxDuration = 60;

/** POST /api/v1/library/bulk: `{ comicIds, status }` cambia el estado de varios cómics a la vez. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await parseBody(request, bulkStatusSchema);
  if (body.error) return body.error;

  const { comicIds, status } = body.data;
  if (status === "READ") await ensureBatchReady(db, getComicVineClient(), comicIds);

  try {
    const result = await setComicsStatus(db, user.id, comicIds, status);
    const achievements = await syncAchievements(db, user.id);
    return Response.json({ ...result, achievements });
  } catch (error) {
    if (error instanceof ComicNotFoundError) return Response.json({ error: "COMIC_NOT_FOUND" }, { status: 404 });
    throw error;
  }
}
