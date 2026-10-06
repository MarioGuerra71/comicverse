import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { getCollection } from "@/server/services/discovery";
import { collectionSearchSchema } from "@/server/validation/collection";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = collectionSearchSchema.safeParse(params);
  if (!parsed.success) {
    return badRequest(
      "INVALID_QUERY",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  return Response.json(await getCollection(db, user.id, parsed.data));
}
