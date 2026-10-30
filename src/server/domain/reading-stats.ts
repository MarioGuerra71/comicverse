// Cálculos de lectura sin BD: siguiente número de una serie, racha semanal y lecturas por mes.
import { sortIssues, type SeriesIssue } from "@/server/domain/series-order";

/**
 * El siguiente número que toca leer: el primero sin leer después del último leído (en orden de
 * lectura). Null si no has leído ninguno o si ya vas al día.
 */
export function nextIssue<T extends SeriesIssue>(issues: T[], readIds: Set<string>): T | null {
  const sorted = sortIssues(issues);
  let lastRead = -1;
  sorted.forEach((issue, i) => {
    if (readIds.has(issue.id)) lastRead = i;
  });
  if (lastRead === -1) return null;
  return sorted.slice(lastRead + 1).find((issue) => !readIds.has(issue.id)) ?? null;
}

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/** Lunes (UTC) de la semana de la fecha, en milisegundos. */
const weekStart = (d: Date) => {
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return day - ((d.getUTCDay() + 6) % 7) * DAY;
};

/**
 * Semanas seguidas con al menos una lectura. Cuenta hasta esta semana o, si esta aún no has
 * leído, hasta la anterior (la racha no se rompe hasta que acaba la semana).
 */
export function weeklyStreak(readDates: Date[], now = new Date()): number {
  const weeks = new Set(readDates.map(weekStart));
  let week = weekStart(now);
  if (!weeks.has(week)) week -= WEEK;
  let streak = 0;
  while (weeks.has(week)) {
    streak += 1;
    week -= WEEK;
  }
  return streak;
}

/** Lecturas de cada uno de los últimos `months` meses (el actual el último), «AAAA-MM». */
export function monthlyCounts(readDates: Date[], now = new Date(), months = 12) {
  const keys = Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const d of readDates) {
    const key = d.toISOString().slice(0, 7);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  return keys.map((month) => ({ month, count: counts.get(month)! }));
}
