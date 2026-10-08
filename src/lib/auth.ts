import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // En Vercel, cada despliegue tiene además su propia dirección (y la de su rama); también son
  // nuestras, así que se aceptan para entrar y registrarse desde ellas.
  trustedOrigins: [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .filter(Boolean)
    .map((host) => `https://${host}`),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  // Límite de peticiones por IP. Reglas de Better Auth: 100 peticiones / 10 s en general y
  // 3 / 10 s para entrar, registrarse y cambiar contraseña o email (fuerza bruta).
  // En BD para que funcione con varias instancias (Vercel). Activo también en desarrollo
  // para poder probarlo; desactivado en los tests.
  rateLimit: {
    enabled: env.NODE_ENV !== "test",
    storage: "database",
  },
});