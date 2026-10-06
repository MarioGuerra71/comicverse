import { describe, expect, it } from "vitest";
import { describeActivity } from "@/lib/activity";

describe("describeActivity", () => {
  it("describe cada cambio del historial", () => {
    expect(describeActivity(null, "PENDING")).toBe("Añadiste a pendientes");
    expect(describeActivity(null, "READING")).toBe("Empezaste");
    expect(describeActivity("DROPPED", "READING")).toBe("Volviste a");
    expect(describeActivity("READING", "READ")).toBe("Terminaste");
    expect(describeActivity(null, "READ")).toBe("Terminaste");
    expect(describeActivity("READING", "DROPPED")).toBe("Abandonaste");
    expect(describeActivity("READ", "PENDING")).toBe("Dejaste para más tarde");
    expect(describeActivity("READ", null)).toBe("Quitaste de tu biblioteca");
  });
});
