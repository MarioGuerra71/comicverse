import { z } from "zod";

// focus: el protagonista de la página de reparto. Sin focus: el personaje más conectado.
export const graphSearchSchema = z.object({
  focus: z.uuid().optional(),
});
