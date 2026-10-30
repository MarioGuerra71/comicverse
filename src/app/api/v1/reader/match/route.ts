import { db } from "@/lib/db";
import { getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import { matchReaderFiles, searchReaderCandidates } from "@/server/services/reader";
import { readerMatchSchema } from "@/server/validation/reader";

/** POST /api/v1/reader/match: qué cómic del catálogo es cada archivo (o búsqueda manual con `q`). */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await parseBody(request, readerMatchSchema);
  if (body.error) return body.error;

  if ("q" in body.data) return Response.json({ candidates: await searchReaderCandidates(db, user.id, body.data.q) });
  return Response.json({ results: await matchReaderFiles(db, user.id, body.data.files) });
}
