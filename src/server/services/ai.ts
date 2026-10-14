import type { ComicSearchInput } from "@/server/validation/catalog";
import { getAIProvider } from "@/server/integrations/ai/provider";

/** ¿Están disponibles las funciones de IA? (la interfaz enseña «próximamente» si no). */
export function isAIEnabled() {
  return getAIProvider() !== null;
}

/**
 * PENDIENTE (IA): búsqueda en lenguaje natural. Traducirá «cómics donde Venom pelea con Carnage»
 * a un ComicSearchInput validado con comicSearchSchema. Hoy devuelve null (búsqueda normal).
 */
export async function naturalLanguageSearch(query: string): Promise<ComicSearchInput | null> {
  void query;
  return null;
}

/**
 * PENDIENTE (IA): recomendaciones de qué leer para completar tus álbumes o descubrir relaciones,
 * a partir de getZoneCollection y getCastPage (solo lo desbloqueado). Hoy, ninguna.
 */
export async function recommendNextReads(userId: string): Promise<{ comicId: string; reason: string }[]> {
  void userId;
  return [];
}
