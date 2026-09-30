import { db } from "@/lib/db";

export async function GET() {
  const publishers = await db.publisher.findMany();
  return Response.json({ status: "ok", publishers });
}