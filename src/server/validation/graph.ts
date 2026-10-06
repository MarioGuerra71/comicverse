import { z } from "zod";

// focus: personaje en el centro (ego-graph a un salto). Sin focus: el grafo completo.
// view: dibujo interactivo o lista accesible con los mismos datos.
export const graphSearchSchema = z.object({
  focus: z.uuid().optional(),
  view: z.enum(["graph", "list"]).default("graph"),
});
