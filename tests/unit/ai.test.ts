import { describe, expect, it } from "vitest";
import { getAIProvider } from "@/server/integrations/ai/provider";

describe("IA (pendiente)", () => {
  it("está apagada por defecto y no cuesta nada", () => {
    expect(getAIProvider({})).toBeNull();
    expect(getAIProvider({ AI_ENABLED: "false" })).toBeNull();
  });

  it("encenderla sin proveedor avisa con un error claro", () => {
    expect(() => getAIProvider({ AI_ENABLED: "true" })).toThrow(/proveedor/);
  });
});
