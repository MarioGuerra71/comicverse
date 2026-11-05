/** Lo mínimo de un cómic para ordenarlo dentro de su serie. */
export interface SeriesIssue {
  id: string;
  issueNumber: string | null;
  releaseDate: Date | null;
}

const issueValue = (n: string | null) => {
  const value = Number.parseFloat(n ?? "");
  return Number.isNaN(value) ? null : value;
};
const time = (i: SeriesIssue) => i.releaseDate?.getTime() ?? Number.POSITIVE_INFINITY;

/**
 * Orden de lectura de una serie. La línea principal va por número («1», «2», «2.1»…), así una
 * fecha mal puesta en Comic Vine no la descoloca (pasaba con The Amazing Spider-Man #12). Lo que
 * no tiene número propio —un anual que repite número, un «#-1», un especial sin número— se
 * coloca por fecha detrás del último número que ya había salido; sin fecha, al final.
 */
export function sortIssues<T extends SeriesIssue>(issues: T[]): T[] {
  const byDate = [...issues].sort((a, b) => time(a) - time(b));
  const seen = new Set<number>();
  const main: T[] = [];
  const extras: T[] = [];
  for (const issue of byDate) {
    const n = issueValue(issue.issueNumber);
    // Si un número se repite, el que salió antes es el de la serie; el otro, un especial.
    if (n === null || n < 0 || seen.has(n)) extras.push(issue);
    else {
      seen.add(n);
      main.push(issue);
    }
  }
  main.sort((a, b) => issueValue(a.issueNumber)! - issueValue(b.issueNumber)!);

  const isMain = new Set<T>(main);
  const result = [...main];
  for (const extra of extras) {
    let at = result.length;
    if (extra.releaseDate) {
      // Detrás del último número publicado antes (o el mismo día) que el especial.
      const last = result.findLastIndex((i) => isMain.has(i) && time(i) <= time(extra));
      at = last + 1;
      // Si hay más especiales en ese hueco, por fecha.
      while (at < result.length && !isMain.has(result[at]) && time(result[at]) <= time(extra)) at++;
    }
    result.splice(at, 0, extra);
  }
  return result;
}

/** Los cómics de la serie desde el principio hasta `targetId` incluido (vacío si no está). */
export function issuesUpTo<T extends SeriesIssue>(issues: T[], targetId: string): T[] {
  const sorted = sortIssues(issues);
  const index = sorted.findIndex((issue) => issue.id === targetId);
  return index === -1 ? [] : sorted.slice(0, index + 1);
}
