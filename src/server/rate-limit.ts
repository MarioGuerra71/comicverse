import type { PrismaClient } from "../../generated/prisma/client";

/** Límites de lo que cuesta peticiones a Comic Vine (su cuota es por hora y compartida por todos). */
export const LIMITS = {
  // Importar una serie son varias peticiones: pocas por hora y lector.
  seriesImport: { max: 15, windowMs: 60 * 60 * 1000 },
  // Cada búsqueda en el catálogo es una petición a Comic Vine.
  remoteSearch: { max: 30, windowMs: 60 * 60 * 1000 },
  // Cada demo crea una cuenta y marca una docena de cómics: pocas por hora y IP.
  demo: { max: 5, windowMs: 60 * 60 * 1000 },
} as const;

/**
 * Cuenta un intento con la clave `key` en una ventana fija y dice si se ha pasado del límite.
 * Usa la tabla RateLimit de Better Auth con claves propias («app:…»); el contador es atómico
 * (un solo INSERT … ON CONFLICT), así que dos peticiones a la vez no se saltan el límite.
 */
export async function isRateLimited(
  db: PrismaClient,
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
  now = Date.now(),
) {
  const windowStart = BigInt(now - windowMs);
  const nowBig = BigInt(now);
  const [row] = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" (id, key, count, "lastRequest")
    VALUES (gen_random_uuid(), ${`app:${key}`}, 1, ${nowBig})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RateLimit"."lastRequest" < ${windowStart} THEN 1 ELSE "RateLimit".count + 1 END,
      "lastRequest" = CASE WHEN "RateLimit"."lastRequest" < ${windowStart} THEN ${nowBig} ELSE "RateLimit"."lastRequest" END
    RETURNING count`;
  return row.count > max;
}
