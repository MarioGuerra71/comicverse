import type { PrismaClient } from "../../../generated/prisma/client";
import type { MatchCandidate } from "@/server/domain/reader-match";

// El mismo nombre normalizado que seriesKey (lib/reader/filename.ts), calculado en PostgreSQL:
// minúsculas, sin acentos, «&» como «and» y solo letras y cifras.
const KEY_SQL = `regexp_replace(translate(replace(lower(s.name), '&', 'and'), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'), '[^a-z0-9]', '', 'g')`;

interface CandidateRow {
  comicId: string;
  title: string;
  issueNumber: string | null;
  releaseDate: Date | null;
  seriesId: string;
  seriesName: string;
  startYear: number | null;
  seriesKey: string;
  owned: boolean;
}

const toCandidate = (r: CandidateRow): MatchCandidate => ({
  comicId: r.comicId,
  title: r.title,
  issueNumber: r.issueNumber,
  releaseYear: r.releaseDate ? r.releaseDate.getUTCFullYear() : null,
  seriesId: r.seriesId,
  seriesName: r.seriesName,
  startYear: r.startYear,
  seriesKey: r.seriesKey,
  owned: r.owned,
});

const SELECT = `
  SELECT c.id AS "comicId", c.title, c."issueNumber", c."releaseDate", s.id AS "seriesId",
         s.name AS "seriesName", s."startYear", k.key AS "seriesKey",
         EXISTS (
           SELECT 1 FROM "UserComic" uc JOIN "Comic" c2 ON c2.id = uc."comicId"
           WHERE c2."seriesId" = s.id AND uc."userId" = $1
         ) AS owned
  FROM "Series" s
  CROSS JOIN LATERAL (SELECT ${KEY_SQL} AS key) k
  JOIN "Comic" c ON c."seriesId" = s.id`;

/** Cómics con esos nombres de serie (normalizados) y esos números. */
export async function findMatchCandidates(db: PrismaClient, userId: string, keys: string[], issues: string[]) {
  if (keys.length === 0 || issues.length === 0) return [];
  const rows = await db.$queryRawUnsafe<CandidateRow[]>(
    `${SELECT} WHERE k.key = ANY($2::text[]) AND c."issueNumber" = ANY($3::text[])`,
    userId,
    keys,
    issues,
  );
  return rows.map(toCandidate);
}

/** Búsqueda manual: series cuyo nombre contiene el texto (y ese número, si se indica). */
export async function searchMatchCandidates(db: PrismaClient, userId: string, key: string, issue: string | null) {
  const rows = await db.$queryRawUnsafe<CandidateRow[]>(
    `${SELECT} WHERE k.key LIKE '%' || $2 || '%' AND ($3::text IS NULL OR c."issueNumber" = $3)
     ORDER BY owned DESC, (k.key = $2) DESC, c."releaseDate" DESC NULLS LAST LIMIT 30`,
    userId,
    key,
    issue,
  );
  return rows.map(toCandidate);
}

/** Cuáles de esos nombres de serie existen en el catálogo. */
export async function findKnownSeriesKeys(db: PrismaClient, keys: string[]) {
  if (keys.length === 0) return new Set<string>();
  const rows = await db.$queryRawUnsafe<{ key: string }[]>(
    `SELECT DISTINCT k.key FROM "Series" s CROSS JOIN LATERAL (SELECT ${KEY_SQL} AS key) k WHERE k.key = ANY($1::text[])`,
    keys,
  );
  return new Set(rows.map((r) => r.key));
}
