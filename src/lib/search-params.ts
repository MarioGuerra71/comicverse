export type SearchParams = Record<string, string | string[] | undefined>;

/** Toma el primer valor de cada parámetro de la URL y descarta los vacíos. */
export function normalizeParams(params: SearchParams) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      return [key, first === "" ? undefined : first];
    }),
  );
}
