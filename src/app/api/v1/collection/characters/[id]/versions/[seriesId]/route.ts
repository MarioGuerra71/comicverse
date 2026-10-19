import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { CharacterNotFoundError, setCharacterVersionImage } from "@/server/services/discovery";
import { versionImageSchema } from "@/server/validation/collection";

type Context = { params: Promise<{ id: string; seriesId: string }> };

/** Imagen del personaje en esta serie: PUT la elige, DELETE vuelve a la de siempre. */
async function handle(request: Request, { params }: Context, method: "PUT" | "DELETE") {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { id, seriesId } = await params;
  if (!z.uuid().safeParse(id).success) return badRequest("INVALID_CHARACTER_ID");
  if (!z.uuid().safeParse(seriesId).success) return badRequest("INVALID_SERIES_ID");

  let imageUrl: string | null = null;
  if (method === "PUT") {
    const body = await parseBody(request, versionImageSchema);
    if (body.error) return body.error;
    imageUrl = body.data.imageUrl;
  }

  try {
    return Response.json(await setCharacterVersionImage(db, user.id, id, seriesId, imageUrl));
  } catch (error) {
    if (error instanceof CharacterNotFoundError) {
      return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });
    }
    throw error;
  }
}

export const PUT = (request: Request, context: Context) => handle(request, context, "PUT");
export const DELETE = (request: Request, context: Context) => handle(request, context, "DELETE");
