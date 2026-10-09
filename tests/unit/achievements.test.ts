import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, evaluateAchievements, type AchievementStats } from "@/server/domain/achievements";

const zero: AchievementStats = {
  read: 0,
  decades: 0,
  readMarvel: 0,
  readDc: 0,
  unlocked: 0,
  collected: 0,
  bestAlbumPercent: 0,
  zonesWithAlbums: 0,
  unlockedMarvel: 0,
  unlockedDc: 0,
};
const byId = (stats: AchievementStats) => new Map(evaluateAchievements(stats).map((p) => [p.id, p]));

describe("evaluateAchievements", () => {
  it("sin actividad no hay nada conseguido", () => {
    expect(evaluateAchievements(zero).every((p) => !p.done && p.current === 0)).toBe(true);
  });

  it("los contadores se cumplen al llegar al objetivo y no lo pasan", () => {
    const p = byId({ ...zero, read: 12 });
    expect(p.get("read-1")).toMatchObject({ done: true, current: 1 });
    expect(p.get("read-10")).toMatchObject({ done: true, current: 10 });
    expect(p.get("read-50")).toMatchObject({ done: false, current: 12, target: 50 });
  });

  it("cruce de universos exige 25 en cada editorial, no en total", () => {
    expect(byId({ ...zero, unlockedMarvel: 40, unlockedDc: 10 }).get("crossover-25")).toMatchObject({ done: false, current: 10 });
    expect(byId({ ...zero, unlockedMarvel: 25, unlockedDc: 25 }).get("crossover-25")?.done).toBe(true);
  });

  it("los álbumes cuentan por porcentaje", () => {
    const p = byId({ ...zero, bestAlbumPercent: 60 });
    expect(p.get("album-50")?.done).toBe(true);
    expect(p.get("album-100")).toMatchObject({ done: false, current: 60 });
  });

  it("los ids son únicos y hay algunos secretos", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.filter((a) => a.secret).length).toBeGreaterThan(0);
  });
});
