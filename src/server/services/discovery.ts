import type { Prisma } from "../../../generated/prisma/client";
import { diffById } from "@/server/domain/unlock";
import type { PrismaClient } from "../../../generated/prisma/client";
import {
  toCharacterSummary,
  toCollection,
  type CharacterSummaryDto,
} from "@/server/dto/character";
import {
  countCollectibleCharacters,
  findCollection,
  findUnlockedCharacters,
} from "@/server/repositories/characters";

export interface UnlockResult {
  newCharacters: CharacterSummaryDto[];
  lostCharacters: CharacterSummaryDto[];
  progress: { unlocked: number; total: number };
}

export type UnlockedSnapshot = Awaited<ReturnType<typeof findUnlockedCharacters>>;

/** Foto de los desbloqueados antes de un cambio (dentro de la transacción). */
export function snapshotUnlocked(tx: Prisma.TransactionClient, userId: string) {
  return findUnlockedCharacters(tx, userId);
}

/** Compara con la foto anterior y devuelve lo que el frontend debe animar. */
export async function buildUnlockResult(
  tx: Prisma.TransactionClient,
  userId: string,
  before: UnlockedSnapshot,
): Promise<UnlockResult> {
  const [after, total] = await Promise.all([
    findUnlockedCharacters(tx, userId),
    countCollectibleCharacters(tx),
  ]);
  const { gained, lost } = diffById(before, after);
  return {
    newCharacters: gained.map(toCharacterSummary),
    lostCharacters: lost.map(toCharacterSummary),
    progress: { unlocked: after.length, total },
  };
}

export async function getCollection(db: PrismaClient, userId: string) {
  return toCollection(await findCollection(db, userId));
}
