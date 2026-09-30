import { describe, it, expect } from "vitest";
import { getCardState, COLLECTED_THRESHOLD } from "@/server/domain/card-state";

describe("getCardState", () => {
  it("es LOCKED si no se ha leído ningún cómic", () => {
    expect(getCardState(0)).toBe("LOCKED");
  });

  it("es DISCOVERED con al menos un cómic leído", () => {
    expect(getCardState(1)).toBe("DISCOVERED");
  });

  it("sigue DISCOVERED justo por debajo del umbral", () => {
    expect(getCardState(COLLECTED_THRESHOLD - 1)).toBe("DISCOVERED");
  });

  it("es COLLECTED al alcanzar el umbral", () => {
    expect(getCardState(COLLECTED_THRESHOLD)).toBe("COLLECTED");
  });
});