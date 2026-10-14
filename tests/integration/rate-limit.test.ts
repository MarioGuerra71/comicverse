import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { isRateLimited } from "@/server/rate-limit";
import { createTestDb, resetDb } from "./test-db";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

const limit = { max: 2, windowMs: 1000 };

describe("isRateLimited", () => {
  it("deja pasar hasta el máximo y vuelve a empezar al acabar la ventana", async () => {
    expect(await isRateLimited(db, "x", limit, 0)).toBe(false);
    expect(await isRateLimited(db, "x", limit, 100)).toBe(false);
    expect(await isRateLimited(db, "x", limit, 200)).toBe(true);
    // Otra clave lleva su propia cuenta.
    expect(await isRateLimited(db, "y", limit, 200)).toBe(false);
    // Pasada la ventana (desde el primer intento), se reinicia.
    expect(await isRateLimited(db, "x", limit, 1500)).toBe(false);
  });

  it("es atómico: diez intentos a la vez solo dejan pasar dos", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => isRateLimited(db, "z", limit, 0)));
    expect(results.filter((limited) => !limited)).toHaveLength(2);
  });
});
