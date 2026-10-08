import "server-only";
import { env } from "@/lib/env";
import { ComicVineClient } from "./client";

let client: ComicVineClient | null | undefined;

/**
 * Cliente de Comic Vine para la app (uno por instancia: así la pausa entre peticiones se respeta
 * dentro de la instancia). null si no hay clave configurada.
 */
export function getComicVineClient(): ComicVineClient | null {
  if (client === undefined) {
    // En la web no se reintenta con esperas de un minuto: mejor fallar y avisar al usuario.
    client = env.COMIC_VINE_API_KEY
      ? new ComicVineClient({ apiKey: env.COMIC_VINE_API_KEY, maxRetries: 0 })
      : null;
  }
  return client;
}
