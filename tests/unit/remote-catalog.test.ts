import { describe, expect, it } from "vitest";
import { toRemoteSeries } from "@/server/services/remote-catalog";

const volume = (id: number, publisherId: number, issues = 5) => ({
  id,
  name: ` Serie ${id} `,
  start_year: "2025",
  publisher: { id: publisherId, name: "x" },
  count_of_issues: issues,
  image: null,
});

describe("toRemoteSeries", () => {
  it("se queda solo con la editorial de la zona y con series que tengan cómics", () => {
    const results = [volume(1, 10), volume(2, 2338), volume(3, 10, 0), volume(4, 31)];
    expect(toRemoteSeries(results, "dc", new Map()).map((s) => s.externalId)).toEqual([1]);
    expect(toRemoteSeries(results, "marvel", new Map()).map((s) => s.externalId)).toEqual([4]);
  });

  it("marca las series que ya están en el catálogo y limpia el nombre", () => {
    const [s] = toRemoteSeries([volume(1, 10)], "dc", new Map([["1", "serie-local"]]));
    expect(s).toMatchObject({ name: "Serie 1", seriesId: "serie-local", issueCount: 5 });
  });
});
