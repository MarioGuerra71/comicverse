import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth-errors";

describe("authErrorMessage", () => {
  it("traduce los códigos conocidos", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }, "x")).toBe(
      "El correo o la contraseña no son correctos.",
    );
  });

  it("el límite de intentos (429) no trae código", () => {
    expect(authErrorMessage({ status: 429 }, "x")).toMatch(/Demasiados intentos/);
  });

  it("usa el mensaje genérico si el código es desconocido o falta", () => {
    expect(authErrorMessage({ code: "ALGO_NUEVO" }, "genérico")).toBe("genérico");
    expect(authErrorMessage({}, "genérico")).toBe("genérico");
  });
});
