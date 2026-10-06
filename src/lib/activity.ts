import type { ReadingStatusKey } from "@/lib/reading-status";

/** Frase de un cambio del historial de lectura; después va el título del cómic. */
export function describeActivity(
  from: ReadingStatusKey | null,
  to: ReadingStatusKey | null,
): string {
  if (to === null) return "Quitaste de tu biblioteca";
  if (to === "READ") return "Terminaste";
  if (to === "READING") return from === null ? "Empezaste" : "Volviste a";
  if (to === "DROPPED") return "Abandonaste";
  return from === null ? "Añadiste a pendientes" : "Dejaste para más tarde";
}
