import { z } from "zod";

// Nombre de usuario para la dirección del perfil (/u/mario): minúsculas, números, - y _.
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]{3,20}$/, "Entre 3 y 20 caracteres: letras sin acentos, números, - o _");

export const profileSettingsSchema = z.object({
  handle: handleSchema,
  isPublic: z.boolean(),
});

export const communitySearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => v || undefined),
});
