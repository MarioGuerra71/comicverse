import { readFile, writeFile } from "node:fs/promises";
import { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import {
  pickBestCharacter,
  type CharacterSearchResult,
} from "@/server/integrations/comic-sources/comicvine/character-matching";

const MARVEL_PUBLISHER_ID = 31;
const CHARACTER_FIELDS = "id,name,real_name,publisher,count_of_issue_appearances";
const VOLUME_FIELDS = "id,name,start_year,count_of_issues,publisher";

interface CharacterCandidate {
  name: string;
  id?: number;
}
interface SeriesCandidate {
  id: number;
  label: string;
}
interface UniverseCandidates {
  series: SeriesCandidate[];
  characters: CharacterCandidate[];
}

interface CvCharacter extends CharacterSearchResult {
  real_name: string | null;
}
interface CvVolume {
  id: number;
  name: string;
  start_year: string | number | null;
  count_of_issues: number;
  publisher: { id: number; name: string } | null;
}

async function main() {
  const apiKey = process.env.COMIC_VINE_API_KEY;
  if (!apiKey) {
    console.error(
      "Falta COMIC_VINE_API_KEY. Ejecuta el script con: npm run universe:resolve",
    );
    process.exit(1);
  }

  const client = new ComicVineClient({ apiKey });
  const candidates = JSON.parse(
    await readFile("data/universe-candidates.json", "utf8"),
  ) as UniverseCandidates;

  // ---- Series ----
  console.log("\nSeries:");
  const seriesRows = [];
  for (const s of candidates.series) {
    const res = await client.get<CvVolume>(`volume/4050-${s.id}`, {
      field_list: VOLUME_FIELDS,
    });
    const v = res.results;
    seriesRows.push({
      id: v.id,
      nombre: v.name,
      año: v.start_year,
      cómics: v.count_of_issues,
      editorial: v.publisher?.name ?? "?",
    });
  }
  console.table(seriesRows);

  // ---- Personajes ----
  console.log("\nPersonajes (esto tarda ~1 minuto, una petición por personaje):");
  const characterRows = [];
  const resolved = [];

  for (const c of candidates.characters) {
    process.stdout.write(`  ${c.name}... `);

    let chosen: CvCharacter | null;
    let status: string;
    let alternatives: CvCharacter[] = [];

    if (c.id !== undefined) {
      const res = await client.get<CvCharacter>(`character/4005-${c.id}`, {
        field_list: CHARACTER_FIELDS,
      });
      chosen = res.results;
      status = "PINNED";
    } else {
      const res = await client.get<CvCharacter[]>("search", {
        resources: "character",
        query: c.name,
        limit: 10,
        field_list: CHARACTER_FIELDS,
      });
      const match = pickBestCharacter(res.results, c.name, MARVEL_PUBLISHER_ID);
      chosen = match.chosen;
      status = match.status;
      alternatives = match.alternatives;
    }

    console.log(status);

    characterRows.push({
      pedido: c.name,
      estado: status,
      id: chosen?.id ?? "-",
      encontrado: chosen?.name ?? "-",
      nombreReal: chosen?.real_name ?? "-",
      apariciones: chosen?.count_of_issue_appearances ?? "-",
    });

    resolved.push({
      requested: c.name,
      status,
      chosen,
      alternatives: alternatives.map((a) => ({
        id: a.id,
        name: a.name,
        appearances: a.count_of_issue_appearances,
      })),
    });
  }

  console.table(characterRows);

  // ---- Avisos ----
  const needsReview = characterRows.filter(
    (r) => r.estado === "FUZZY" || r.estado === "NOT_FOUND",
  );
  if (needsReview.length > 0) {
    console.log("\nRevisar a mano:");
    for (const r of needsReview) console.log(`  - ${r.pedido} (${r.estado})`);
  }

  const idCounts = new Map<number, string[]>();
  for (const r of characterRows) {
    if (typeof r.id === "number") {
      idCounts.set(r.id, [...(idCounts.get(r.id) ?? []), r.pedido]);
    }
  }
  for (const [id, names] of idCounts) {
    if (names.length > 1) {
      console.log(`\nAviso: varios candidatos resuelven al mismo id ${id}: ${names.join(", ")}`);
    }
  }

  await writeFile(
    "data/universe.resolved.json",
    JSON.stringify({ series: seriesRows, characters: resolved }, null, 2),
    "utf8",
  );
  console.log("\nResultado guardado en data/universe.resolved.json");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});