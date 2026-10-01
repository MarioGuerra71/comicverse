const DEFAULT_BASE_URL = "https://comicvine.gamespot.com/api";

export interface ComicVineResponse<T> {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: T;
}

export class ComicVineError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ComicVineError";
    this.statusCode = statusCode;
  }
}

export interface ComicVineClientOptions {
  apiKey: string;
  userAgent?: string;
  baseUrl?: string;
  /** Pausa mínima entre peticiones, en milisegundos. */
  minIntervalMs?: number;
  /** Cuántas veces reintentar ante un fallo temporal. */
  maxRetries?: number;
  /** Espera tras un aviso de límite de peticiones, en milisegundos. */
  retryWaitMs?: number;
  // Piezas inyectables: permiten probar sin red ni esperas reales.
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

function isRetryableStatus(status: number): boolean {
  return status === 420 || status === 429 || status >= 500;
}

function looksLikeRateLimit(message: string): boolean {
  return /rate limit|slow down/i.test(message);
}

export class ComicVineClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly retryWaitMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private lastRequestAt = 0;

  constructor(options: ComicVineClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.userAgent = options.userAgent ?? "ComicVerse-portfolio";
    this.minIntervalMs = options.minIntervalMs ?? 1100;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryWaitMs = options.retryWaitMs ?? 60_000;
    this.fetchFn = options.fetchFn ?? fetch;
    this.sleep =
      options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.now = options.now ?? Date.now;
  }

  async get<T>(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<ComicVineResponse<T>> {
    const url = this.buildUrl(path, params);

    for (let attempt = 0; ; attempt++) {
      await this.throttle();

      let response: Response;
      try {
        response = await this.fetchFn(url, {
          headers: { "User-Agent": this.userAgent },
        });
      } catch {
        if (attempt >= this.maxRetries) {
          throw new ComicVineError(`Network error calling ${path}`);
        }
        await this.sleep(this.retryWaitMs);
        continue;
      }

      if (isRetryableStatus(response.status)) {
        if (attempt >= this.maxRetries) {
          throw new ComicVineError(
            `HTTP ${response.status} calling ${path}`,
            response.status,
          );
        }
        await this.sleep(this.retryWaitMs);
        continue;
      }

      if (!response.ok) {
        throw new ComicVineError(
          `HTTP ${response.status} calling ${path}`,
          response.status,
        );
      }

      const body = (await response.json()) as ComicVineResponse<T>;

      if (body.status_code !== 1) {
        if (looksLikeRateLimit(body.error) && attempt < this.maxRetries) {
          await this.sleep(this.retryWaitMs);
          continue;
        }
        throw new ComicVineError(
          `Comic Vine error on ${path}: ${body.error}`,
          body.status_code,
        );
      }

      return body;
    }
  }

  /** Recorre todas las páginas de un listado, de una en una. */
  async *paginate<T>(
    path: string,
    params: Record<string, string | number> = {},
    pageSize = 100,
  ): AsyncGenerator<T[]> {
    let offset = 0;

    for (;;) {
      const page = await this.get<T[]>(path, { ...params, limit: pageSize, offset });
      yield page.results;

      offset += page.number_of_page_results;
      if (page.number_of_page_results === 0 || offset >= page.number_of_total_results) {
        return;
      }
    }
  }

  private buildUrl(path: string, params: Record<string, string | number>): string {
    const query = new URLSearchParams({
      api_key: this.apiKey,
      format: "json",
    });
    for (const [key, value] of Object.entries(params)) {
      query.set(key, String(value));
    }
    return `${this.baseUrl}/${path}/?${query.toString()}`;
  }

  private async throttle(): Promise<void> {
    const wait = this.lastRequestAt + this.minIntervalMs - this.now();
    if (wait > 0) await this.sleep(wait);
    this.lastRequestAt = this.now();
  }
}