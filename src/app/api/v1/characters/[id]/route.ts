import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { getCharacterDetail } from "@/server/services/discovery";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return badRequest("INVALID_CHARACTER_ID");

  const character = await getCharacterDetail(db, user.id, id);
  // Bloqueado o inexistente responden igual: no se confirma ni que exista.
  if (!character) return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });

  return Response.json({ character });
}
