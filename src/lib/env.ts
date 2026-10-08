import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  // Opcional: sin ella la app funciona, pero no busca ni importa cómics nuevos de Comic Vine.
  COMIC_VINE_API_KEY: z.string().min(1).optional(),
});

// En Vercel no hace falta BETTER_AUTH_URL: se usa el dominio de producción que pone la
// plataforma (VERCEL_PROJECT_PRODUCTION_URL, sin protocolo). Los despliegues de vista previa
// también apuntan ahí, así que el acceso solo funciona en producción.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const env = envSchema.parse({
  ...process.env,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? (vercelUrl ? `https://${vercelUrl}` : undefined),
});
