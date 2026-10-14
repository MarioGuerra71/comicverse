import { HANDLE_PATTERN } from "@/lib/handles";
import { z } from "zod";

// Nombre de usuario para la dirección del perfil (/u/mario): minúsculas, números, - y _.
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(HANDLE_PATTERN, "Entre 3 y 20 caracteres: letras sin acentos, números, - o _");

// Se cambian por separado: el interruptor guarda al instante y el nombre tiene su propio botón.
export const profileSettingsSchema = z
  .object({ handle: handleSchema.optional(), isPublic: z.boolean().optional() })
  .refine((v) => v.handle !== undefined || v.isPublic !== undefined, "Nada que cambiar");

export const communitySearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => v || undefined),
});
