import { describe, it, expect } from "vitest";
import { formatDate, pluralize } from "@/lib/format";

describe("formatDate", () => {
  it("da formato largo en español", () => {
    expect(formatDate("1962-09-01")).toBe("1 de septiembre de 1962");
  });

  it("no se desplaza un día por la zona horaria", () => {
    expect(formatDate("1962-12-31")).toBe("31 de diciembre de 1962");
    expect(formatDate(null)).toBeNull();
  });
});

describe("pluralize", () => {
  it("usa el singular solo con 1", () => {
    expect(pluralize(1, "personaje", "personajes")).toBe("1 personaje");
  });

  it("usa el plural en el resto de casos, incluido 0", () => {
    expect(pluralize(0, "personaje", "personajes")).toBe("0 personajes");
    expect(pluralize(5, "personaje", "personajes")).toBe("5 personajes");
  });
});