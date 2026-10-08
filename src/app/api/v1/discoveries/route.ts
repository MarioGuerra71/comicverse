import { getZone } from "@/server/zone";
import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { listDiscoveries } from "@/server/services/dashboard";
import { discoveriesSearchSchema } from "@/server/validation/discoveries";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = discoveriesSearchSchema.safeParse(params);
  if (!parsed.success) {
    return badRequest(
      "INVALID_QUERY",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  return Response.json(await listDiscoveries(db, user.id, parsed.data, await getZone()));
}
