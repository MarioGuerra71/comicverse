import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchComics } from "@/server/services/catalog";
import { comicSearchSchema } from "@/server/validation/catalog";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = comicSearchSchema.safeParse(params);
  if (!parsed.success) {
    return Response.json(
      {
        error: "INVALID_QUERY",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  return Response.json(await searchComics(db, parsed.data));
}