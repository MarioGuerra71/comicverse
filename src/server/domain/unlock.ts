/** Compara dos listas por id: qué elementos aparecen y cuáles desaparecen. */
export function diffById<T extends { id: string }>(before: T[], after: T[]) {
  const beforeIds = new Set(before.map((item) => item.id));
  const afterIds = new Set(after.map((item) => item.id));
  return {
    gained: after.filter((item) => !beforeIds.has(item.id)),
    lost: before.filter((item) => !afterIds.has(item.id)),
  };
}
