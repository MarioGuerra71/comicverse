import { db } from "@/lib/db";
import { getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { getProfileSettings, HandleTakenError, saveHandle, saveVisibility } from "@/server/services/social";
import { profileSettingsSchema } from "@/server/validation/social";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  return Response.json(await getProfileSettings(db, user.id));
}

/** PATCH /api/v1/profile: `{ handle }` y/o `{ isPublic }`. */
export async function PATCH(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await parseBody(request, profileSettingsSchema);
  if (body.error) return body.error;

  try {
    let result = null;
    if (body.data.handle !== undefined) result = await saveHandle(db, user.id, body.data.handle);
    if (body.data.isPublic !== undefined) result = await saveVisibility(db, user.id, body.data.isPublic);
    return Response.json(result);
  } catch (error) {
    if (error instanceof HandleTakenError) return Response.json({ error: "HANDLE_TAKEN" }, { status: 409 });
    throw error;
  }
}
