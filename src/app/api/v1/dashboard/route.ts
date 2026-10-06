import { db } from "@/lib/db";
import { getApiUser, unauthorized } from "@/server/auth/api";
import { getDashboard } from "@/server/services/dashboard";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  return Response.json(await getDashboard(db, user.id));
}
