import { describe, expect, it } from "vitest";
import { issuesUpTo } from "@/server/domain/series-order";

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

  it("a igual fecha, ordena por número", () => {
    const sameDay = [issue("b", "2", "2020-01-01"), issue("a", "1", "2020-01-01")];
    expect(issuesUpTo(sameDay, "b").map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("si el cómic no es de la serie, no devuelve nada", () => {
    expect(issuesUpTo(series, "otro")).toEqual([]);
  });
});
