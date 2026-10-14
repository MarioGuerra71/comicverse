import { describe, expect, it } from "vitest";
import { brandZoneForVisit, parseZone, zoneSwitchTarget } from "@/lib/zones";

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

describe("zoneOfPublisher", () => {
  it("traduce el nombre de la editorial a su zona", async () => {
    const { zoneOfPublisher } = await import("@/lib/zones");
    expect(zoneOfPublisher("DC Comics")).toBe("dc");
    expect(zoneOfPublisher("Marvel")).toBe("marvel");
    expect(zoneOfPublisher("Panini España")).toBeNull();
    expect(zoneOfPublisher(null)).toBeNull();
  });
});

describe("zoneSwitchTarget", () => {
  it("una ficha de la otra editorial vuelve a su sección", () => {
    expect(zoneSwitchTarget("/comics/abc")).toBe("/catalog");
    expect(zoneSwitchTarget("/characters/abc")).toBe("/collection");
    expect(zoneSwitchTarget("/collection/abc")).toBe("/collection");
  });

  it("una pantalla de sección se queda donde está", () => {
    expect(zoneSwitchTarget("/collection")).toBe("/collection");
    expect(zoneSwitchTarget("/graph")).toBe("/graph");
    expect(zoneSwitchTarget("/u/ana")).toBe("/u/ana");
  });
});
