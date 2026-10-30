import { z } from "zod";
import { db } from "@/lib/db";
import { getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { isRateLimited, LIMITS } from "@/server/rate-limit";
import { searchRemoteForReader } from "@/server/services/reader";

const remoteSearchSchema = z.object({ q: z.string().trim().min(1).max(120) });

/** POST /api/v1/reader/remote: series de Comic Vine con ese nombre, para traer la que es. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await parseBody(request, remoteSearchSchema);
  if (body.error) return body.error;

  // Cada búsqueda gasta una petición de la cuota de Comic Vine, que es de todos.
  if (await isRateLimited(db, `remote-search:${user.id}`, LIMITS.remoteSearch)) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  const client = getComicVineClient();
  if (!client) return Response.json({ error: "COMIC_VINE_DISABLED" }, { status: 503 });

  try {
    return Response.json({ series: await searchRemoteForReader(db, client, body.data.q) });
  } catch {
    return Response.json({ error: "COMIC_VINE_UNAVAILABLE" }, { status: 502 });
  }
}
