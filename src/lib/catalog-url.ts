export interface CatalogHrefParams {
  q?: string;
  seriesId?: string;
  sort?: string;
  page?: number;
}

/** Construye /catalog?... omitiendo los valores por defecto. */
export function buildCatalogHref(params: CatalogHrefParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.seriesId) query.set("seriesId", params.seriesId);
  if (params.sort && params.sort !== "release_desc") query.set("sort", params.sort);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const queryString = query.toString();
  return queryString ? `/catalog?${queryString}` : "/catalog";
}