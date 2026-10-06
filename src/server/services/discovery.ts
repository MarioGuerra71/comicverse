import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { diffById } from "@/server/domain/unlock";
import type { RelationshipType } from "@/lib/relationship-types";
import {
  isDiscovered,
  pickRelationships,
  type Relationship,
} from "@/server/domain/relationships";
import type { CollectionSearchInput } from "@/server/validation/collection";
import {
  filterCards,
  toCharacterDetail,
  toCharacterSummary,
  toCollection,
  type CharacterSummaryDto,
} from "@/server/dto/character";
import {
  addFavorite,
  countCollectibleCharacters,
  isCharacterUnlocked,
  removeFavorite,
  countComicsPerCharacter,
  findCharacterWithLibrary,
  findCoAppearancePairs,
  findCollection,
  findCuratedRelationships,
  findComicByExternalId,
  findUnlockedCharacters,
} from "@/server/repositories/characters";

type Db = PrismaClient | Prisma.TransactionClient;

export interface UnlockResult {
  newCharacters: CharacterSummaryDto[];
  lostCharacters: CharacterSummaryDto[];
  /** Relaciones que se acaban de descubrir (sus dos personajes ya desbloqueados). */
  newRelationships: number;
  progress: { unlocked: number; total: number };
}

export type UnlockedSnapshot = Awaited<ReturnType<typeof findUnlockedCharacters>>;

/** Todas las relaciones "aparecen juntos" del universo (iguales para todos los usuarios). */
export async function getRelationships(db: Db): Promise<Relationship[]> {
  const [pairs, counts, curated] = await Promise.all([
    findCoAppearancePairs(db),
    countComicsPerCharacter(db),
    findCuratedRelationships(db),
  ]);
  return pickRelationships(
    pairs,
    new Map(counts.map((c) => [c.id, c.comics])),
    curated.map((c) => ({
      a: c.characterAId,
      b: c.characterBId,
      // El importador ya validó el tipo contra la lista de lib/relationship-types.
      type: c.type as RelationshipType,
    })),
  );
}

const idsOf = (list: { id: string }[]) => new Set(list.map((item) => item.id));

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
  const [after, total, relationships] = await Promise.all([
    findUnlockedCharacters(tx, userId),
    countCollectibleCharacters(tx),
    getRelationships(tx),
  ]);
  const { gained, lost } = diffById(before, after);
  const beforeIds = idsOf(before);
  const afterIds = idsOf(after);
  return {
    newCharacters: gained.map(toCharacterSummary),
    lostCharacters: lost.map(toCharacterSummary),
    newRelationships: relationships.filter(
      (r) => isDiscovered(r, afterIds) && !isDiscovered(r, beforeIds),
    ).length,
    progress: { unlocked: after.length, total },
  };
}

export class CharacterNotFoundError extends Error {
  constructor() {
    super("Character not found");
    this.name = "CharacterNotFoundError";
  }
}

export async function getCollection(
  db: PrismaClient,
  userId: string,
  input: CollectionSearchInput = { filter: "all", sort: "name" },
) {
  const [rows, relationships] = await Promise.all([
    findCollection(db, userId),
    getRelationships(db),
  ]);
  const collection = toCollection(rows);
  const unlockedIds = idsOf(collection.cards);
  const { cards } = collection;
  return {
    cards: filterCards(cards, input),
    // Las siluetas solo tienen sentido en "todos".
    locked: input.filter === "all" ? collection.locked : 0,
    counts: {
      all: collection.progress.total,
      favorites: cards.filter((c) => c.isFavorite).length,
      discovered: cards.filter((c) => c.state === "DISCOVERED").length,
      collected: cards.filter((c) => c.state === "COLLECTED").length,
    },
    progress: collection.progress,
    relationships: {
      discovered: relationships.filter((r) => isDiscovered(r, unlockedIds)).length,
      total: relationships.length,
    },
  };
}

/** Ficha de un personaje; null si no existe, no es coleccionable o está bloqueado. */
export async function getCharacterDetail(db: PrismaClient, userId: string, id: string) {
  const row = await findCharacterWithLibrary(db, id, userId);
  if (!row) return null;
  const detail = toCharacterDetail(
    row,
    row.firstAppearanceExternalId
      ? await findComicByExternalId(db, row.firstAppearanceExternalId)
      : null,
  );
  if (!detail) return null;

  const [unlocked, relationships] = await Promise.all([
    findUnlockedCharacters(db, userId),
    getRelationships(db),
  ]);
  const unlockedById = new Map(unlocked.map((c) => [c.id, c]));
  // Primero las curadas (con tipo), después por puntuación.
  const mine = relationships
    .filter((r) => r.a === id || r.b === id)
    .sort((x, y) => Number(!!y.type) - Number(!!x.type) || y.score - x.score);

  // Solo se nombran las relaciones con personajes desbloqueados; del resto, el número.
  const discovered = mine.flatMap((r) => {
    const other = unlockedById.get(r.a === id ? r.b : r.a);
    return other
      ? [{ character: toCharacterSummary(other), shared: r.shared, type: r.type }]
      : [];
  });

  return {
    ...detail,
    relationships: discovered,
    hiddenRelationships: mine.length - discovered.length,
  };
}

/** Marca o desmarca un favorito. Bloqueado o inexistente: CharacterNotFoundError (no se revela nada). */
export async function setCharacterFavorite(
  db: PrismaClient,
  userId: string,
  characterId: string,
  isFavorite: boolean,
) {
  if (!(await isCharacterUnlocked(db, userId, characterId))) throw new CharacterNotFoundError();
  if (isFavorite) await addFavorite(db, userId, characterId);
  else await removeFavorite(db, userId, characterId);
  return { isFavorite };
}
