import { describe, expect, it } from "vitest";
import { isHiddenEntry, looksLikeImage } from "@/lib/reader/archive";

describe("páginas de un .cbr/.cbz", () => {
  it("descarta los archivos ocultos que deja un Mac (rompían la portada)", () => {
    expect(isHiddenEntry("._001.jpg")).toBe(true);
    expect(isHiddenEntry("__MACOSX/Green Lantern/._001.jpg")).toBe(true);
    expect(isHiddenEntry("Green Lantern\\._001.jpg")).toBe(true);
    expect(isHiddenEntry("Green Lantern/001.jpg")).toBe(false);
  });

  it("reconoce una imagen por sus primeros bytes, no por el nombre", () => {
    expect(looksLikeImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(looksLikeImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    // Cabecera AppleDouble de macOS («._001.jpg»): no es una imagen.
    expect(looksLikeImage(new Uint8Array([0x00, 0x05, 0x16, 0x07, 0, 2, 0, 0, 0x4d, 0x61, 0x63, 0x20]))).toBe(false);
  });
});
