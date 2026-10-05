import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import {
  ComicNotFoundError,
  getLibraryEntry,
  removeFromLibrary,
  setComicStatus,
} from "@/server/services/library";
import { comicIdSchema, setStatusSchema } from "@/server/validation/library";

type Context = { params: Promise<{ comicId: string }> };

export async function GET(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  return Response.json({ entry: await getLibraryEntry(db, user.id, comicId) });
}

export async function PUT(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("INVALID_JSON");
  }

  const parsed = setStatusSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(
      "INVALID_BODY",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  try {
    return Response.json(await setComicStatus(db, user.id, comicId, parsed.data.status));
  } catch (error) {
    if (error instanceof ComicNotFoundError) {
      return Response.json({ error: "COMIC_NOT_FOUND" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  return Response.json(await removeFromLibrary(db, user.id, comicId));
}