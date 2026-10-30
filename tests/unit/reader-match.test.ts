import { describe, expect, it } from "vitest";
import { chooseMatches, chooseRemoteVolume, type MatchCandidate } from "@/server/domain/reader-match";

const cand = (seriesId: string, issue: string, year: number, owned = false): MatchCandidate => ({
  comicId: `${seriesId}-${issue}`,
  title: `Green Lantern #${issue}`,
  issueNumber: issue,
  releaseYear: year,
  seriesId,
  seriesName: "Green Lantern",
  startYear: year,
  seriesKey: "greenlantern",
  owned,
});
const known = new Set(["greenlantern"]);
const file = (key: string, name: string, path = "") => ({ key, name, path });

describe("chooseMatches", () => {
  it("una sola serie posible: enlaza aunque cambien signos y ceros («Green Lantern 021»)", () => {
    const [r] = chooseMatches([file("a", "Green Lantern 021.cbr")], [cand("gl2005", "21", 2007)], known);
    expect(r.match?.comicId).toBe("gl2005-21");
  });

  it("varias series: decide el año de la carpeta", () => {
    const rows = [cand("gl1960", "21", 1963), cand("gl2005", "21", 2007), cand("gl2011", "21", 2013)];
    const [r] = chooseMatches([file("a", "Green Lantern #21.cbr", "GREEN LANTERN 2005/08 - Sinestro")], rows, known);
    expect(r.match?.seriesId).toBe("gl2005");
  });

  it("sin año: la única de esas series que ya tienes en tu biblioteca", () => {
    const rows = [cand("gl1960", "21", 1963), cand("gl2005", "21", 2007, true)];
    expect(chooseMatches([file("a", "Green Lantern #21.cbr")], rows, known)[0].match?.seriesId).toBe("gl2005");
  });

  it("sin pistas no adivina: deja las opciones (las tuyas primero)", () => {
    const rows = [cand("gl1960", "21", 1963), cand("gl2005", "21", 2007)];
    const [r] = chooseMatches([file("a", "Green Lantern #21.cbr")], rows, known);
    expect(r.match).toBeNull();
    expect(r.candidates.map((c) => c.seriesId)).toEqual(["gl2005", "gl1960"]);
  });

  it("los archivos de la misma carpeta y serie siguen la decisión de los demás", () => {
    const rows = [cand("gl1960", "21", 1963), cand("gl2005", "21", 2007), cand("gl1960", "22", 1963), cand("gl2005", "22", 2007, true)];
    const results = chooseMatches(
      [file("a", "Green Lantern #21.cbr", "Green Lantern"), file("b", "Green Lantern #22.cbr", "Green Lantern")],
      rows.map((r) => (r.issueNumber === "21" ? { ...r, owned: false } : r)),
      known,
    );
    expect(results.map((r) => r.match?.seriesId)).toEqual(["gl2005", "gl2005"]);
  });

  it("con una serie elegida a mano, solo busca en esa", () => {
    const rows = [cand("gl1960", "21", 1963), cand("gl2005", "21", 2007)];
    const [r] = chooseMatches([{ ...file("a", "Green Lantern #21.cbr"), seriesId: "gl1960" }], rows, known);
    expect(r.match?.seriesId).toBe("gl1960");
  });

  it("dice si el catálogo conoce la serie (para traerla de Comic Vine si no)", () => {
    const [r] = chooseMatches([file("a", "Absolute Evil 01.cbr")], [], known);
    expect(r).toMatchObject({ match: null, seriesKnown: false, series: "Absolute Evil", issue: "1" });
  });
});

describe("chooseRemoteVolume", () => {
  const dc = new Set([10]);
  const vol = (id: number, name: string, year: number, issues = 50, publisher = 10) => ({
    id,
    name,
    start_year: String(year),
    count_of_issues: issues,
    publisher: { id: publisher },
  });

  it("una sola serie con ese nombre y editorial", () => {
    const volumes = [vol(1, "Absolute Evil", 2025, 1), vol(2, "Absolute Evil", 2025, 3, 99), vol(3, "Absolute Evil Special", 2025)];
    expect(chooseRemoteVolume(volumes, { series: "Absolute Evil", issue: "1", year: null }, dc)?.id).toBe(1);
  });

  it("varias: la que empezó ese año o justo antes; sin año, ninguna", () => {
    const volumes = [vol(1, "Green Lantern", 1960), vol(2, "Green Lantern", 2005, 67), vol(3, "Green Lantern", 2011)];
    expect(chooseRemoteVolume(volumes, { series: "Green Lantern", issue: "21", year: 2007 }, dc)?.id).toBe(2);
    expect(chooseRemoteVolume(volumes, { series: "Green Lantern", issue: "21", year: null }, dc)).toBeNull();
  });

  it("descarta series que no llegan a ese número", () => {
    expect(chooseRemoteVolume([vol(1, "Absolute Flash", 2025, 5)], { series: "Absolute Flash", issue: "12", year: null }, dc)).toBeNull();
  });
});
