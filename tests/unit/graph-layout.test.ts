import { describe, expect, it } from "vitest";
import { layoutGraph, NODE_SIZE } from "@/lib/graph-layout";

const distance = (p: { x: number; y: number }, q: { x: number; y: number }) =>
  Math.hypot(p.x - q.x, p.y - q.y);

describe("layoutGraph", () => {
  // a–b enlazados; c y d sueltos.
  const { positions, radius } = layoutGraph(["a", "b", "c", "d"], [{ source: "a", target: "b" }]);

  it("da una posición numérica a cada nodo", () => {
    for (const id of ["a", "b", "c", "d"]) {
      const p = positions.get(id)!;
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
  });

  it("acerca los nodos enlazados más que los sueltos", () => {
    expect(distance(positions.get("a")!, positions.get("b")!)).toBeLessThan(
      distance(positions.get("c")!, positions.get("d")!),
    );
  });

  it("no solapa nodos y deja el anillo de siluetas fuera de todos", () => {
    const all = [...positions.values()];
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++)
        expect(distance(all[i], all[j])).toBeGreaterThan(NODE_SIZE);
    for (const p of all) expect(Math.hypot(p.x, p.y)).toBeLessThan(radius);
  });

  it("funciona sin nodos", () => {
    expect(layoutGraph([], []).positions.size).toBe(0);
  });
});
