/** Lo mínimo de un cómic para ordenarlo dentro de su serie. */
export interface SeriesIssue {
  id: string;
  issueNumber: string | null;
  releaseDate: Date | null;
}

const issueValue = (n: string | null) => {
  const value = Number.parseFloat(n ?? "");
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
};

/**
 * Orden de lectura de una serie: por fecha de salida (sin fecha, al final) y, a igualdad, por
 * número («1», «2», «2.1»…). Así un anual o un número especial cae donde salió.
 */
export function sortIssues<T extends SeriesIssue>(issues: T[]): T[] {
  return [...issues].sort((a, b) => {
    const da = a.releaseDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const db = b.releaseDate?.getTime() ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return issueValue(a.issueNumber) - issueValue(b.issueNumber);
  });
}

/** Los cómics de la serie desde el principio hasta `targetId` incluido (vacío si no está). */
export function issuesUpTo<T extends SeriesIssue>(issues: T[], targetId: string): T[] {
  const sorted = sortIssues(issues);
  const index = sorted.findIndex((issue) => issue.id === targetId);
  return index === -1 ? [] : sorted.slice(0, index + 1);
}
