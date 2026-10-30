import { db } from "@/lib/db";
import { getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { ComicVineError } from "@/server/integrations/comic-sources/comicvine/client";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { isRateLimited, LIMITS } from "@/server/rate-limit";
import { importSeriesForFile } from "@/server/services/reader";
import { readerImportSchema } from "@/server/validation/reader";

// Una serie larga son varias páginas de Comic Vine con una pausa de 1,1 s entre ellas.
export const maxDuration = 300;

/** POST /api/v1/reader/import: trae de Comic Vine la serie de un archivo que el catálogo no tiene. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await parseBody(request, readerImportSchema);
  if (body.error) return body.error;

  // Misma cuota que importar desde el catálogo: Comic Vine es de todos.
  if (await isRateLimited(db, `series-import:${user.id}`, LIMITS.seriesImport)) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": "3600" } });
  }

  const client = getComicVineClient();
  if (!client) return Response.json({ error: "COMIC_VINE_DISABLED" }, { status: 503 });

  try {
    return Response.json({ series: await importSeriesForFile(db, client, body.data) });
  } catch (error) {
    if (error instanceof ComicVineError) return Response.json({ error: "COMIC_VINE_UNAVAILABLE" }, { status: 502 });
    throw error;
  }
}
