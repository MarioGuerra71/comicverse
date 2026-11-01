import { describe, expect, it } from "vitest";
import { currentWeek, issueWindow, localDay, nextIssue, readingTimeline, weeklyStreak } from "@/server/domain/reading-stats";

const issue = (id: string, n: string) => ({ id, issueNumber: n, releaseDate: null });

describe("nextIssue", () => {
  const issues = [issue("c", "3"), issue("a", "1"), issue("d", "4"), issue("b", "2")];

  it("devuelve el primero sin leer después del último leído", () => {
    expect(nextIssue(issues, new Set(["a", "b"]))?.id).toBe("c");
  });

  it("salta los huecos anteriores: sigue desde el último leído", () => {
    expect(nextIssue(issues, new Set(["a", "c"]))?.id).toBe("d");
  });

  it("null si no has leído ninguno o si vas al día", () => {
    expect(nextIssue(issues, new Set())).toBeNull();
    expect(nextIssue(issues, new Set(["d"]))).toBeNull();
  });
});

describe("weeklyStreak", () => {
  // Jueves 29 de octubre de 2026.
  const now = new Date("2026-10-29T12:00:00Z");

  it("cuenta semanas seguidas hasta esta semana", () => {
    const dates = ["2026-10-26", "2026-10-20", "2026-10-12"].map((d) => new Date(`${d}T10:00:00Z`));
    expect(weeklyStreak(dates, now)).toBe(3);
  });

  it("si esta semana aún no has leído, cuenta desde la anterior", () => {
    expect(weeklyStreak([new Date("2026-10-21T10:00:00Z")], now)).toBe(1);
  });

  it("una semana sin leer rompe la racha", () => {
    expect(weeklyStreak([new Date("2026-10-28T10:00:00Z"), new Date("2026-10-13T10:00:00Z")], now)).toBe(1);
    expect(weeklyStreak([new Date("2026-10-05T10:00:00Z")], now)).toBe(0);
  });
});

describe("readingTimeline", () => {
  const at = (iso: string) => new Date(iso);
  // Sábado 31 de octubre de 2026, por la tarde en España.
  const now = at("2026-10-31T17:00:00Z");

  it("por día: los últimos 30, hoy el último", () => {
    const days = readingTimeline([at("2026-10-31T09:00:00Z"), at("2026-10-31T10:00:00Z"), at("2026-10-02T10:00:00Z")], "day", now);
    expect(days).toHaveLength(30);
    expect(days.at(-1)).toEqual({ key: "2026-10-31", count: 2 });
    expect(days[0]).toEqual({ key: "2026-10-02", count: 1 });
  });

  it("los días van en hora de España: las 00:30 del 1 de noviembre son el día 1", () => {
    // 23:30 UTC del 31 de octubre = 00:30 en Madrid (horario de invierno, UTC+1).
    expect(localDay(at("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
    const days = readingTimeline([at("2026-10-31T23:30:00Z")], "day", at("2026-11-01T10:00:00Z"));
    expect(days.at(-1)).toEqual({ key: "2026-11-01", count: 1 });
  });

  it("por semana: de lunes a domingo, la actual la última", () => {
    const weeks = readingTimeline([at("2026-10-26T10:00:00Z"), at("2026-10-25T10:00:00Z")], "week", now);
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)).toEqual({ key: "2026-10-26", count: 1 });
    expect(weeks.at(-2)).toEqual({ key: "2026-10-19", count: 1 });
  });

  it("por mes: los últimos 12 e ignora lo anterior", () => {
    const months = readingTimeline([at("2026-10-01T10:00:00Z"), at("2026-08-03T10:00:00Z"), at("2025-01-01T10:00:00Z")], "month", now);
    expect(months).toHaveLength(12);
    expect(months.at(-1)).toEqual({ key: "2026-10", count: 1 });
    expect(months.at(-3)).toEqual({ key: "2026-08", count: 1 });
    expect(months[0].key).toBe("2025-11");
  });
});

describe("currentWeek", () => {
  it("de lunes a domingo, con hoy marcado y los días que faltan", () => {
    // Jueves 29 de octubre de 2026.
    const week = currentWeek([new Date("2026-10-26T10:00:00Z"), new Date("2026-10-29T08:00:00Z"), new Date("2026-10-29T09:00:00Z")], new Date("2026-10-29T12:00:00Z"));
    expect(week.map((d) => d.key)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
    expect(week.map((d) => d.count)).toEqual([1, 0, 0, 2, 0, 0, 0]);
    expect(week.findIndex((d) => d.today)).toBe(3);
    expect(week.filter((d) => d.future)).toHaveLength(3);
  });
});

describe("issueWindow", () => {
  const issues = Array.from({ length: 100 }, (_, i) => issue(`c${i + 1}`, String(i + 1)));

  it("centra la tira en el número actual", () => {
    const { start, items } = issueWindow(issues, "c50", 10);
    expect(start).toBe(44);
    expect(items.map((i) => i.id)).toContain("c50");
    expect(items).toHaveLength(10);
  });

  it("al principio y al final de la serie no se sale", () => {
    expect(issueWindow(issues, "c2", 10).start).toBe(0);
    expect(issueWindow(issues, "c99", 10).start).toBe(90);
    expect(issueWindow(issues.slice(0, 4), "c2", 10)).toMatchObject({ start: 0, items: { length: 4 } });
  });
});
