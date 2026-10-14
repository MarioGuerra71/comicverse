// Nombres de usuario (/u/<handle>): minúsculas, números, - y _ (3–20). Compartido cliente/servidor.
export const HANDLE_PATTERN = /^[a-z0-9_-]{3,20}$/;

/** Convierte lo que escribe el usuario (o su nombre) en un nombre de usuario válido: «María López» → «maria-lopez». */
export function normalizeHandle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20)
    .replace(/-$/, "");
}

/** Propuesta a partir del nombre; si queda corta, «lector». */
export function handleFromName(name: string): string {
  const base = normalizeHandle(name);
  return base.length >= 3 ? base : "lector";
}

/** Variante con número para cuando el nombre ya está cogido: «mario» → «mario-2». */
export function handleWithSuffix(base: string, n: number): string {
  const suffix = `-${n}`;
  return base.slice(0, 20 - suffix.length).replace(/-$/, "") + suffix;
}
