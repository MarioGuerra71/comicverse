import { db } from "@/lib/db";
import { getApiUser, unauthorized } from "@/server/auth/api";
import { getCollection } from "@/server/services/discovery";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  return Response.json(await getCollection(db, user.id));
}
