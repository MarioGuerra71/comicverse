import { db } from "@/lib/db";
import { getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { getProfileSettings, HandleTakenError, saveProfileSettings } from "@/server/services/social";
import { profileSettingsSchema } from "@/server/validation/social";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  return Response.json(await getProfileSettings(db, user.id));
}

/** PATCH /api/v1/profile: nombre de usuario y si el perfil es público. */
export async function PATCH(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await parseBody(request, profileSettingsSchema);
  if (body.error) return body.error;

  try {
    return Response.json(await saveProfileSettings(db, user.id, body.data.handle, body.data.isPublic));
  } catch (error) {
    if (error instanceof HandleTakenError) return Response.json({ error: "HANDLE_TAKEN" }, { status: 409 });
    throw error;
  }
}
