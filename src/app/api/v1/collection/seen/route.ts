import { db } from "@/lib/db";
import { getApiUser, unauthorized } from "@/server/auth/api";
import { markCollectionSeen } from "@/server/repositories/discoveries";

// La colección se ha visto: lo descubierto hasta ahora deja de ser "nuevo".
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  await markCollectionSeen(db, user.id);
  return new Response(null, { status: 204 });
}
