import { describe, expect, it } from "vitest";
import { brandZoneForVisit, parseZone } from "@/lib/zones";

describe("brandZoneForVisit", () => {
  it("primera visita Marvel, segunda DC y después al azar", () => {
    // El contador ya incluye la visita actual (1 = primera).
    expect(brandZoneForVisit(1)).toBe("marvel");
    expect(brandZoneForVisit(2)).toBe("dc");
    expect(brandZoneForVisit(3, () => 0.1)).toBe("marvel");
    expect(brandZoneForVisit(5, () => 0.9)).toBe("dc");
  });
});

describe("parseZone", () => {
  it("cualquier valor desconocido es Marvel", () => {
    expect(parseZone("dc")).toBe("dc");
    expect(parseZone(undefined)).toBe("marvel");
    expect(parseZone("<script>")).toBe("marvel");
  });
});
