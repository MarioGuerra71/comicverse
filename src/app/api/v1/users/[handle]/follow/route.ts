import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { follow, ProfileNotFoundError, unfollow } from "@/server/services/social";
import { handleSchema } from "@/server/validation/social";

type Context = { params: Promise<{ handle: string }> };

async function run(request: Request, { params }: Context, action: typeof follow) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const handle = handleSchema.safeParse((await params).handle);
  if (!handle.success) return badRequest("INVALID_HANDLE");

  try {
    await action(db, user.id, handle.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    // Privado, inexistente o uno mismo: el mismo 404 (no revela si existe).
    if (error instanceof ProfileNotFoundError) return Response.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    throw error;
  }
}

/** PUT: seguir a un perfil público. DELETE: dejar de seguirlo. */
export const PUT = (request: Request, context: Context) => run(request, context, follow);
export const DELETE = (request: Request, context: Context) => run(request, context, unfollow);
