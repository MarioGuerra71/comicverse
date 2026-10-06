import { db } from "@/lib/db";
import { badRequest, getApiUser, unauthorized } from "@/server/auth/api";
import { z } from "zod";
import {
  ComicNotFoundError,
  getLibraryEntry,
  NotInLibraryError,
  RatingRequiresReadError,
  removeFromLibrary,
  setComicStatus,
  updateLibraryEntry,
} from "@/server/services/library";
import {
  comicIdSchema,
  setStatusSchema,
  updateEntrySchema,
} from "@/server/validation/library";

type Context = { params: Promise<{ comicId: string }> };

/** Lee el JSON del cuerpo y lo valida; devuelve los datos o una respuesta 400. */
async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: badRequest("INVALID_JSON") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: badRequest(
        "INVALID_BODY",
        parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      ),
    };
  }
  return { data: parsed.data };
}

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

  const body = await parseBody(request, setStatusSchema);
  if (body.error) return body.error;

  try {
    return Response.json(await setComicStatus(db, user.id, comicId, body.data.status));
  } catch (error) {
    if (error instanceof ComicNotFoundError) {
      return Response.json({ error: "COMIC_NOT_FOUND" }, { status: 404 });
    }
    throw error;
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  const body = await parseBody(request, updateEntrySchema);
  if (body.error) return body.error;

  try {
    return Response.json(await updateLibraryEntry(db, user.id, comicId, body.data));
  } catch (error) {
    if (error instanceof NotInLibraryError) {
      return Response.json({ error: "NOT_IN_LIBRARY" }, { status: 404 });
    }
    if (error instanceof RatingRequiresReadError) {
      return Response.json({ error: "RATING_REQUIRES_READ" }, { status: 409 });
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