import { describe, expect, it } from "vitest";
import { pickConstellations, skyPosition } from "@/lib/sky-layout";

describe("skyPosition", () => {
  const total = 32;
  const points = Array.from({ length: total }, (_, i) => skyPosition(i + 1, total));

  it("deja todas las estrellas dentro del dibujo", () => {
    for (const { x, y } of points) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
  });

  it("no amontona estrellas y siempre da la misma posición al mismo número", () => {
    for (let i = 0; i < total; i++)
      for (let j = i + 1; j < total; j++)
        expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThan(0.04);
    expect(skyPosition(7, total)).toEqual(points[6]);
  });
});

describe("pickConstellations", () => {
  it("limita las líneas por estrella y se queda con las de más cómics juntos", () => {
    // El centro "hub" está relacionado con todos; cada pareja con sus cómics juntos.
    const edges = [
      { a: "hub", b: "a", shared: 50 },
      { a: "hub", b: "b", shared: 40 },
      { a: "hub", b: "c", shared: 30 },
      { a: "hub", b: "d", shared: 20 },
      { a: "c", b: "d", shared: 10 },
    ];
    const kept = pickConstellations(edges, 3);
    expect(kept.map((e) => `${e.a}-${e.b}`)).toEqual(["hub-a", "hub-b", "hub-c", "c-d"]);
  });
});
