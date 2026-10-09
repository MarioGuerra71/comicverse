import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { diffById } from "@/server/domain/unlock";
import { findSeriesPublisherSlug } from "@/server/repositories/comics";
import { ZONES, type Zone } from "@/lib/zones";
import type { RelationshipType } from "@/lib/relationship-types";
import {
  isDiscovered,
  pickRelationships,
  type Relationship,
} from "@/server/domain/relationships";
import type { CollectionSearchInput } from "@/server/validation/collection";
import {
  filterCards,
  toAlbums,
  toCastPage,
  toCharacterDetail,
  toCharacterSummary,
  toCollection,
  type CharacterSummaryDto,
} from "@/server/dto/character";
import { findNewCharacterIds } from "@/server/repositories/discoveries";
import {
  addFavorite,
  countCollectibleCharacters,
  isCharacterUnlocked,
  removeFavorite,
  countComicsPerCharacter,
  findCharacterWithLibrary,
  findCoAppearancePairs,
  findAlbumRows,
  findCollection,
  findSeriesAlbumRows,
  findSeriesCovers,
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
  input: CollectionSearchInput = { filter: "all", sort: "number" },
) {
  const [rows, relationships, newIds] = await Promise.all([
    findCollection(db, userId),
    getRelationships(db),
    findNewCharacterIds(db, userId),
  ]);
  const collection = toCollection(rows);
  const unlockedIds = idsOf(collection.cards);
  const cards = collection.cards.map((c) => ({ ...c, isNew: newIds.has(c.id) }));
  return {
    cards: filterCards(cards, input),
    // Las siluetas solo tienen sentido en "todos".
    locked: input.filter === "all" ? collection.locked : 0,
    lockedNumbers: input.filter === "all" ? collection.lockedNumbers : [],
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

export interface GraphEdgeDto {
  source: string;
  target: string;
  type: RelationshipType | null;
  shared: number;
}

/**
 * Grafo del universo descubierto: nodos = personajes desbloqueados; enlaces = relaciones
 * descubiertas (los dos extremos desbloqueados). De los bloqueados solo va el número:
 * se dibujan como siluetas sueltas, sin enlaces, para no dar pistas.
 * Con `focus`: solo ese personaje y sus vecinos directos (un salto); null si está bloqueado.
 */
/**
 * Personajes y relaciones de una zona: los de las series de la editorial que el usuario tiene
 * en su biblioteca (el mismo criterio que los álbumes). Sin zona: todos los coleccionables.
 */
export async function getUniverse(db: PrismaClient, userId: string, zone?: Zone) {
  const [rows, relationships, albumRows, newIds] = await Promise.all([
    findCollection(db, userId),
    getRelationships(db),
    zone ? findAlbumRows(db, userId, ZONES[zone].publisherSlug) : null,
    findNewCharacterIds(db, userId),
  ]);
  const collection = toCollection(rows);
  // «Nuevo» = descubierto desde la última visita a la colección (como en los álbumes).
  const all = { ...collection, cards: collection.cards.map((c) => ({ ...c, isNew: newIds.has(c.id) })) };
  if (!albumRows) return { ...all, relationships };

  const zoneIds = new Set(albumRows.flatMap((r) => (r.characterId ? [r.characterId] : [])));
  const cards = all.cards.filter((c) => zoneIds.has(c.id));
  return {
    cards,
    locked: zoneIds.size - cards.length,
    progress: { unlocked: cards.length, total: zoneIds.size },
    relationships: relationships.filter((r) => zoneIds.has(r.a) && zoneIds.has(r.b)),
  };
}

export async function getGraph(db: PrismaClient, userId: string, focus?: string, zone?: Zone) {
  const { cards, locked, progress, relationships } = await getUniverse(db, userId, zone);
  const unlockedIds = idsOf(cards);
  const edges: GraphEdgeDto[] = relationships
    .filter((r) => isDiscovered(r, unlockedIds))
    .map((r) => ({ source: r.a, target: r.b, type: r.type, shared: r.shared }));

  if (!focus) return { nodes: cards, edges, locked, progress, focus: null, hiddenRelationships: 0 };
  if (!unlockedIds.has(focus)) return null;

  const around = new Set([focus]);
  for (const e of edges) {
    if (e.source === focus) around.add(e.target);
    if (e.target === focus) around.add(e.source);
  }
  return {
    nodes: cards.filter((c) => around.has(c.id)),
    edges: edges.filter((e) => around.has(e.source) && around.has(e.target)),
    locked: 0,
    progress,
    focus,
    // Relaciones del personaje aún sin descubrir: solo el número (como en su ficha).
    hiddenRelationships: relationships.filter(
      (r) => (r.a === focus || r.b === focus) && !isDiscovered(r, unlockedIds),
    ).length,
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

/**
 * Colección de una zona: un álbum por cada serie de la editorial que el usuario tiene en su
 * biblioteca, y (para los filtros) las cartas desbloqueadas de esos álbumes.
 */
export async function getZoneCollection(
  db: PrismaClient,
  userId: string,
  zone: Zone,
  input: CollectionSearchInput = { filter: "all", sort: "number" },
) {
  const [full, rows] = await Promise.all([
    getCollection(db, userId),
    findAlbumRows(db, userId, ZONES[zone].publisherSlug),
  ]);
  const zoneIds = new Set(rows.flatMap((r) => (r.characterId ? [r.characterId] : [])));
  const cards = full.cards.filter((c) => zoneIds.has(c.id));
  const covers = await findSeriesCovers(db, [...new Set(rows.map((r) => r.seriesId))]);
  return {
    albums: toAlbums(rows, new Map(cards.map((c) => [c.id, c]))).map((a) => ({
      ...a,
      coverThumbUrl: covers.get(a.seriesId) ?? null,
    })),
    cards: filterCards(cards, input),
    counts: {
      all: zoneIds.size,
      favorites: cards.filter((c) => c.isFavorite).length,
      discovered: cards.filter((c) => c.state === "DISCOVERED").length,
      collected: cards.filter((c) => c.state === "COLLECTED").length,
    },
    progress: { unlocked: cards.length, total: zoneIds.size },
    hasNew: cards.some((c) => c.isNew),
  };
}

/** Página de reparto del Universo de una zona (ver toCastPage). */
export async function getCastPage(db: PrismaClient, userId: string, zone: Zone, focusId?: string) {
  const { cards, relationships } = await getUniverse(db, userId, zone);
  return toCastPage(cards, relationships, focusId);
}

/**
 * Un álbum (serie) para el archivador. null si el usuario no tiene ningún cómic de la serie.
 * Incluye la zona de su editorial para pintarlo con su color aunque estés en la otra zona.
 */
export async function getAlbum(db: PrismaClient, userId: string, seriesId: string) {
  const [rows, full, publisherSlug] = await Promise.all([
    findSeriesAlbumRows(db, userId, seriesId),
    getCollection(db, userId),
    findSeriesPublisherSlug(db, seriesId),
  ]);
  if (rows.length === 0 || !publisherSlug) return null;
  const [album] = toAlbums(rows, new Map(full.cards.map((c) => [c.id, c])));
  const zone = (Object.keys(ZONES) as Zone[]).find((z) => ZONES[z].publisherSlug === publisherSlug) ?? null;
  return { album, zone };
}
