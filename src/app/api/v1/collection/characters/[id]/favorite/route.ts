import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { CharacterNotFoundError, setCharacterFavorite } from "@/server/services/discovery";
import { favoriteSchema } from "@/server/validation/collection";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return badRequest("INVALID_CHARACTER_ID");

  const body = await parseBody(request, favoriteSchema);
  if (body.error) return body.error;

  try {
    return Response.json(await setCharacterFavorite(db, user.id, id, body.data.isFavorite));
  } catch (error) {
    if (error instanceof CharacterNotFoundError) {
      return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });
    }
    throw error;
  }
}
