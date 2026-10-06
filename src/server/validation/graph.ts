import { z } from "zod";

// focus: personaje en el centro (ego-graph a un salto). Sin focus: el grafo completo.
export const graphSearchSchema = z.object({ focus: z.uuid().optional() });
