import { describe, expect, it } from "vitest";
import { monthlyCounts, nextIssue, weeklyStreak } from "@/server/domain/reading-stats";

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

describe("monthlyCounts", () => {
  it("agrupa por mes los últimos meses e ignora lo anterior", () => {
    const now = new Date("2026-10-15T00:00:00Z");
    const dates = ["2026-10-01", "2026-10-20", "2026-08-03", "2025-01-01"].map((d) => new Date(`${d}T10:00:00Z`));
    expect(monthlyCounts(dates, now, 3)).toEqual([
      { month: "2026-08", count: 1 },
      { month: "2026-09", count: 0 },
      { month: "2026-10", count: 2 },
    ]);
  });
});
