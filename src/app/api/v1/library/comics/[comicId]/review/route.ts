import { db } from "@/lib/db";
import { badRequest, getApiUser, parseBody, unauthorized } from "@/server/auth/api";
import {
  getReview,
  NotInLibraryError,
  removeReview,
  ReviewRequiresReadError,
  writeReview,
} from "@/server/services/library";
import { comicIdSchema, reviewSchema } from "@/server/validation/library";

type Context = { params: Promise<{ comicId: string }> };

export async function GET(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  return Response.json({ review: await getReview(db, user.id, comicId) });
}

export async function PUT(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  const body = await parseBody(request, reviewSchema);
  if (body.error) return body.error;

  try {
    return Response.json(await writeReview(db, user.id, comicId, body.data.body));
  } catch (error) {
    if (error instanceof NotInLibraryError) {
      return Response.json({ error: "NOT_IN_LIBRARY" }, { status: 404 });
    }
    if (error instanceof ReviewRequiresReadError) {
      return Response.json({ error: "REVIEW_REQUIRES_READ" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { comicId } = await params;
  if (!comicIdSchema.safeParse(comicId).success) return badRequest("INVALID_COMIC_ID");

  return Response.json(await removeReview(db, user.id, comicId));
}
