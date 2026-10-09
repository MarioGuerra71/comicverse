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
 * Si el archivo no cuadra (tipo inválido, pareja repetida…) lanza un error y no cambia nada.
 */
export async function importRelationships(db: PrismaClient, file: unknown) {
  const { relationships } = fileSchema.parse(file);

  const externalIds = [...new Set(relationships.flatMap((r) => [String(r.a), String(r.b)]))];
  const characters = await db.character.findMany({
    where: { source: "COMICVINE", externalId: { in: externalIds } },
    select: { id: true, externalId: true },
  });
  const idByExternal = new Map(characters.map((c) => [c.externalId, c.id]));
  // Validación del archivo entero (aunque falten personajes): parejas repetidas o consigo mismo.
  const seenPairs = new Set<string>();
  for (const r of relationships) {
    if (r.a === r.b) throw new Error(`Relación de un personaje consigo mismo: ${r.a}`);
    const key = r.a < r.b ? `${r.a}|${r.b}` : `${r.b}|${r.a}`;
    if (seenPairs.has(key)) throw new Error(`Pareja repetida: ${r.label ?? `${r.a}–${r.b}`}`);
    seenPairs.add(key);
  }

  // Las parejas con algún personaje que aún no está en la BD (p. ej. de DC, que llegan al abrir sus
  // cómics) se saltan; el cron diario vuelve a aplicar el archivo y entran cuando existan.
  const skipped: string[] = [];
  const rows = relationships.flatMap((r) => {
    const x = idByExternal.get(String(r.a));
    const y = idByExternal.get(String(r.b));
    if (!x || !y) {
      skipped.push(r.label ?? `${r.a}–${r.b}`);
      return [];
    }
    // Orden fijo (el menor primero), el mismo que exige el CHECK de la base de datos.
    const [characterAId, characterBId] = x < y ? [x, y] : [y, x];
    return [{ characterAId, characterBId, type: r.type, note: r.note ?? null }];
  });

  await db.$transaction([
    db.characterRelationship.deleteMany(),
    db.characterRelationship.createMany({ data: rows }),
  ]);
  return { imported: rows.length, skipped };
}
