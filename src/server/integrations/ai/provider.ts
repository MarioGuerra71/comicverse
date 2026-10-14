// Capa de IA (pendiente de implementar; ver CLAUDE.md §15). Todo pasa por el servidor y el
// contexto que se envía a un modelo se construye con los mismos DTO que la interfaz, así que
// nunca incluye personajes bloqueados (regla de spoilers por construcción).
import type { z } from "zod";

export interface AIProvider {
  /** Texto libre (resúmenes, explicaciones). */
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>;
  /** Respuesta validada con un esquema Zod (p. ej. un ComicSearchInput a partir de una frase). */
  generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
  /** Vectores para búsqueda semántica (pgvector en la misma BD, previsto). */
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Proveedor configurado o null si la IA está apagada (AI_ENABLED distinto de "true", por defecto).
 * Pendiente: elegir proveedor (de pago, o un modelo local gratuito como Ollama) y añadir el
 * AIGateway (límite de uso por usuario, caché y registro de coste).
 */
export function getAIProvider(env: Record<string, string | undefined> = process.env): AIProvider | null {
  if (env.AI_ENABLED !== "true") return null;
  // ponytail: aún no hay ningún proveedor; activar AI_ENABLED sin implementarlo es un error claro.
  throw new Error("AI_ENABLED=true pero no hay ningún proveedor de IA implementado todavía.");
}
