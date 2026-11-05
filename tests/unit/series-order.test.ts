import { describe, expect, it } from "vitest";
import { issuesUpTo, sortIssues } from "@/server/domain/series-order";

const issue = (id: string, issueNumber: string | null, date: string | null) => ({
  id,
  issueNumber,
  releaseDate: date ? new Date(date) : null,
});

const series = [
  issue("n3", "3", "2020-03-01"),
  issue("n1", "1", "2020-01-01"),
  issue("annual", "1", "2020-02-15"),
  issue("n2", "2", "2020-02-01"),
  issue("sin-fecha", "4", null),
];

describe("issuesUpTo", () => {
  it("devuelve la serie en orden de salida hasta el cómic indicado", () => {
    expect(issuesUpTo(series, "n3").map((i) => i.id)).toEqual(["n1", "n2", "annual", "n3"]);
    expect(issuesUpTo(series, "n1").map((i) => i.id)).toEqual(["n1"]);
  });

  it("los cómics sin fecha van al final", () => {
    expect(issuesUpTo(series, "sin-fecha")).toHaveLength(5);
  });

  it("la línea principal va por número aunque una fecha esté mal (The Amazing Spider-Man #12)", () => {
    const asm = [
      issue("n11", "11", "1964-01-10"),
      issue("n12", "12", "1964-05-01"), // fecha mal en Comic Vine: después del #14
      issue("n13", "13", "1964-03-10"),
      issue("n14", "14", "1964-04-09"),
    ];
    expect(sortIssues(asm).map((i) => i.id)).toEqual(["n11", "n12", "n13", "n14"]);
  });

  it("los números negativos y sin número van por fecha entre los demás", () => {
    const withExtras = [
      issue("n1", "1", "1997-01-01"),
      issue("menos1", "-1", "1997-07-01"),
      issue("n2", "2", "1997-06-01"),
      issue("n3", "3", "1997-08-01"),
      issue("especial", null, "1997-06-15"),
    ];
    expect(sortIssues(withExtras).map((i) => i.id)).toEqual(["n1", "n2", "especial", "menos1", "n3"]);
  });

  it("a igual fecha, ordena por número", () => {
    const sameDay = [issue("b", "2", "2020-01-01"), issue("a", "1", "2020-01-01")];
    expect(issuesUpTo(sameDay, "b").map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("si el cómic no es de la serie, no devuelve nada", () => {
    expect(issuesUpTo(series, "otro")).toEqual([]);
  });
});
