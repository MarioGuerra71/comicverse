import { describe, it, expect, vi } from "vitest";
import {
  ComicVineClient,
  ComicVineError,
  type ComicVineClientOptions,
} from "@/server/integrations/comic-sources/comicvine/client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function okBody<T>(results: T[]) {
  return {
    error: "OK",
    limit: 100,
    offset: 0,
    number_of_page_results: results.length,
    number_of_total_results: results.length,
    status_code: 1,
    results,
  };
}

function makeClient(
  fetchFn: typeof fetch,
  overrides: Partial<ComicVineClientOptions> = {},
) {
  return new ComicVineClient({
    apiKey: "secret-key",
    userAgent: "test-agent",
    minIntervalMs: 0,
    retryWaitMs: 0,
    fetchFn,
    sleep: async () => {},
    ...overrides,
  });
}

describe("ComicVineClient", () => {
  it("envía la clave, el formato JSON y el User-Agent", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => jsonResponse(okBody([])));
    const client = makeClient(fetchFn);

    await client.get("characters", { limit: 5 });

    const [url, init] = fetchFn.mock.calls[0];
    expect(String(url)).toContain("/characters/");
    expect(String(url)).toContain("api_key=secret-key");
    expect(String(url)).toContain("format=json");
    expect(String(url)).toContain("limit=5");
    expect((init?.headers as Record<string, string>)["User-Agent"]).toBe("test-agent");
  });

  it("espera entre peticiones para respetar el ritmo", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => jsonResponse(okBody([])));
    const sleep = vi.fn(async () => {});
    const client = makeClient(fetchFn, {
      minIntervalMs: 1000,
      sleep,
      now: () => 5000, // el reloj "no avanza": la segunda petición tiene que esperar
    });

    await client.get("characters");
    await client.get("characters");

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it("reintenta cuando el servidor pide ir más despacio", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("slow down", { status: 420 }))
      .mockImplementation(async () => jsonResponse(okBody([{ id: 1 }])));
    const client = makeClient(fetchFn);

    const result = await client.get<{ id: number }[]>("characters");

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(result.results).toEqual([{ id: 1 }]);
  });

  it("lanza un error claro sin filtrar la clave de API", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        error: "Invalid API Key",
        limit: 0,
        offset: 0,
        number_of_page_results: 0,
        number_of_total_results: 0,
        status_code: 100,
        results: [],
      }),
    );
    const client = makeClient(fetchFn);

    const error = await client.get("characters").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ComicVineError);
    expect((error as ComicVineError).statusCode).toBe(100);
    expect((error as ComicVineError).message).not.toContain("secret-key");
  });

  it("recorre todas las páginas de un listado", async () => {
    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      const offset = Number(new URL(String(input)).searchParams.get("offset"));
      const count = offset === 0 ? 100 : 50;
      const results = Array.from({ length: count }, (_, i) => ({ id: offset + i }));
      return jsonResponse({
        error: "OK",
        limit: 100,
        offset,
        number_of_page_results: count,
        number_of_total_results: 150,
        status_code: 1,
        results,
      });
    });
    const client = makeClient(fetchFn);

    const all: { id: number }[] = [];
    for await (const page of client.paginate<{ id: number }>("issues")) {
      all.push(...page);
    }

    expect(all).toHaveLength(150);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});