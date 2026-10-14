import { describe, expect, it } from "vitest";
import { HANDLE_PATTERN, handleFromName, handleWithSuffix, normalizeHandle } from "@/lib/handles";

describe("nombres de usuario", () => {
  it("quita acentos, pasa a minúsculas y cambia espacios por guiones", () => {
    expect(normalizeHandle("María López")).toBe("maria-lopez");
    expect(normalizeHandle("  Peter__Parker!! ")).toBe("peter__parker");
    expect(normalizeHandle("Ñandú 2099")).toBe("nandu-2099");
  });

  it("propone uno válido aunque el nombre sea raro o corto", () => {
    expect(handleFromName("Jo")).toBe("lector");
    expect(handleFromName("一二三")).toBe("lector");
    expect(HANDLE_PATTERN.test(handleFromName("Un nombre larguísimo de verdad que no cabe"))).toBe(true);
  });

  it("los sufijos respetan el máximo de 20", () => {
    expect(handleWithSuffix("mario", 2)).toBe("mario-2");
    const long = handleWithSuffix("abcdefghijklmnopqrst", 12);
    expect(long).toBe("abcdefghijklmnopq-12");
    expect(HANDLE_PATTERN.test(long)).toBe(true);
  });
});
