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

/** Los días se cuentan en hora de España: un cómic leído a las 00:30 es de ese día, no del anterior. */
export const TIME_ZONE = "Europe/Madrid";

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
/** «AAAA-MM-DD» de la fecha en esa zona horaria. */
export function localDay(date: Date, timeZone = TIME_ZONE) {
  let fmt = dayFormatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    dayFormatters.set(timeZone, fmt);
  }
  return fmt.format(date);
}

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
/** Lunes de la semana de ese día. */
const mondayOf = (day: string) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

/**
 * Semanas seguidas (de lunes a domingo) con al menos una lectura. Cuenta hasta esta semana o, si
 * esta aún no has leído, hasta la anterior (la racha no se rompe hasta que acaba la semana).
 */
export function weeklyStreak(readDates: Date[], now = new Date(), timeZone = TIME_ZONE): number {
  const weeks = new Set(readDates.map((d) => mondayOf(localDay(d, timeZone))));
  let week = mondayOf(localDay(now, timeZone));
  if (!weeks.has(week)) week = addDays(week, -7);
  let streak = 0;
  while (weeks.has(week)) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}

export type TimelineView = "day" | "week" | "month";

/** Cuántos periodos enseña cada vista: un mes de días, un trimestre de semanas, un año de meses. */
export const TIMELINE_LENGTH: Record<TimelineView, number> = { day: 30, week: 12, month: 12 };

/**
 * Lecturas por periodo, del más antiguo al actual. Claves: «AAAA-MM-DD» (día), el lunes de la
 * semana (semana) o «AAAA-MM» (mes).
 */
export function readingTimeline(readDates: Date[], view: TimelineView, now = new Date(), timeZone = TIME_ZONE) {
  const today = localDay(now, timeZone);
  const n = TIMELINE_LENGTH[view];
  const keyOf = (day: string) => (view === "day" ? day : view === "week" ? mondayOf(day) : day.slice(0, 7));
  const keys = Array.from({ length: n }, (_, i) => {
    const back = n - 1 - i;
    if (view === "day") return addDays(today, -back);
    if (view === "week") return addDays(mondayOf(today), -7 * back);
    const [y, m] = today.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1 - back, 1)).toISOString().slice(0, 7);
  });
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const d of readDates) {
    const key = keyOf(localDay(d, timeZone));
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  return keys.map((key) => ({ key, count: counts.get(key)! }));
}
