import { z } from "zod";
import type { PrismaClient } from "../../../generated/prisma/client";
import { RELATIONSHIP_TYPES, type RelationshipType } from "@/lib/relationship-types";

const fileSchema = z.object({
  relationships: z.array(
    z.object({
      a: z.number().int(),
      b: z.number().int(),
      type: z.enum(RELATIONSHIP_TYPES as [RelationshipType, ...RelationshipType[]]),
      label: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
});

/**
 * Sustituye las relaciones curadas por las de data/relationships.json (repetible).
 * Si algo no cuadra (id desconocido, pareja repetida…) lanza un error y no cambia nada.
 */
export async function importRelationships(db: PrismaClient, file: unknown) {
  const { relationships } = fileSchema.parse(file);

  const externalIds = [...new Set(relationships.flatMap((r) => [String(r.a), String(r.b)]))];
  const characters = await db.character.findMany({
    where: { source: "COMICVINE", externalId: { in: externalIds } },
    select: { id: true, externalId: true },
  });
  const idByExternal = new Map(characters.map((c) => [c.externalId, c.id]));
  const missing = externalIds.filter((id) => !idByExternal.has(id));
  if (missing.length) {
    throw new Error(`Personajes no importados (revisa universe.json): ${missing.join(", ")}`);
  }

  const seen = new Set<string>();
  const rows = relationships.map((r) => {
    const x = idByExternal.get(String(r.a))!;
    const y = idByExternal.get(String(r.b))!;
    if (x === y) throw new Error(`Relación de un personaje consigo mismo: ${r.a}`);
    // Orden fijo (el menor primero), el mismo que exige el CHECK de la base de datos.
    const [characterAId, characterBId] = x < y ? [x, y] : [y, x];
    const key = `${characterAId}|${characterBId}`;
    if (seen.has(key)) throw new Error(`Pareja repetida: ${r.label ?? `${r.a}–${r.b}`}`);
    seen.add(key);
    return { characterAId, characterBId, type: r.type, note: r.note ?? null };
  });

  await db.$transaction([
    db.characterRelationship.deleteMany(),
    db.characterRelationship.createMany({ data: rows }),
  ]);
  return rows.length;
}
