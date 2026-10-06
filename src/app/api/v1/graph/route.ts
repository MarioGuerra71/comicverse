import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { getGraph } from "@/server/services/discovery";
import { graphSearchSchema } from "@/server/validation/graph";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = graphSearchSchema.safeParse(params);
  if (!parsed.success) return badRequest("INVALID_QUERY");

  const graph = await getGraph(db, user.id, parsed.data.focus);
  // Personaje bloqueado o inexistente: el mismo 404 que en su ficha.
  if (!graph) return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });

  return Response.json(graph);
}
