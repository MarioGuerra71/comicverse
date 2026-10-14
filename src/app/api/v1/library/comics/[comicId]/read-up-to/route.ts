import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { ensureBatchReady } from "@/server/jobs/sync-comic-characters";
import { syncAchievements } from "@/server/services/achievements";
import { ComicNotFoundError, findUnreadUpTo, setComicsStatus } from "@/server/services/library";
import { comicIdSchema } from "@/server/validation/library";

export const maxDuration = 60;

type Context = { params: Promise<{ comicId: string }> };

/** POST: marca como leídos todos los cómics de la serie desde el primero hasta este. */
export async function POST(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  try {
    const comicIds = await findUnreadUpTo(db, user.id, comicId);
    if (comicIds.length === 0) return Response.json({ changed: 0, unlock: null, achievements: [] });
    await ensureBatchReady(db, getComicVineClient(), comicIds);
    const result = await setComicsStatus(db, user.id, comicIds, "READ");
    const achievements = await syncAchievements(db, user.id);
    return Response.json({ ...result, achievements });
  } catch (error) {
    if (error instanceof ComicNotFoundError) return Response.json({ error: "COMIC_NOT_FOUND" }, { status: 404 });
    throw error;
  }
}
