import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { isHandleAvailable } from "@/server/services/social";
import { handleSchema } from "@/server/validation/social";

/** GET /api/v1/profile/handle?value=x: ¿está libre ese nombre de usuario? (para avisar mientras escribes). */
export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  const parsed = handleSchema.safeParse(new URL(request.url).searchParams.get("value") ?? "");
  if (!parsed.success) return badRequest("INVALID_HANDLE");
  return Response.json({ available: await isHandleAvailable(db, user.id, parsed.data) });
}
