import { db } from "@/lib/db";
import { getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { ComicVineError } from "@/server/integrations/comic-sources/comicvine/client";
import { getComicVineClient } from "@/server/integrations/comic-sources/comicvine/server-client";
import { importRemoteSeries, WrongPublisherError } from "@/server/services/remote-catalog";
import { importSeriesSchema } from "@/server/validation/remote-catalog";

// Una serie larga son varias páginas de Comic Vine con una pausa de 1,1 s entre ellas.
export const maxDuration = 300;

/** POST /api/v1/series/import: añade al catálogo una serie de Comic Vine con todos sus cómics. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await parseBody(request, importSeriesSchema);
  if (body.error) return body.error;

  const client = getComicVineClient();
  if (!client) return Response.json({ error: "COMIC_VINE_DISABLED" }, { status: 503 });

  try {
    const { seriesId, comics } = await importRemoteSeries(
      db,
      client,
      body.data.publisher,
      body.data.externalId,
    );
    return Response.json({ seriesId, comics });
  } catch (error) {
    if (error instanceof WrongPublisherError) {
      return Response.json({ error: "WRONG_PUBLISHER" }, { status: 422 });
    }
    if (error instanceof ComicVineError) {
      // 404 de Comic Vine = la serie no existe; lo demás, el servicio no responde.
      return error.statusCode === 404 || error.statusCode === 101
        ? Response.json({ error: "SERIES_NOT_FOUND" }, { status: 404 })
        : Response.json({ error: "COMIC_VINE_UNAVAILABLE" }, { status: 502 });
    }
    throw error;
  }
}
