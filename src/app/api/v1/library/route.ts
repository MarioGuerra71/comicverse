import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { listLibrary } from "@/server/services/library";
import { librarySearchSchema } from "@/server/validation/library";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = librarySearchSchema.safeParse(params);
  if (!parsed.success) {
    return badRequest(
      "INVALID_QUERY",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  return Response.json(await listLibrary(db, user.id, parsed.data));
}