import { readFile, writeFile } from "node:fs/promises";
import { ComicVineClient } from "@/server/integrations/comic-sources/comicvine/client";
import { buildRelationshipSuggestions } from "@/server/integrations/comic-sources/comicvine/relationship-suggestions";
import type { UniverseFile } from "@/server/jobs/import-universe";

const OUTPUT = "data/relationships.suggested.json";

interface CvCharacterLinks {
  id: number;
  name: string;
  character_friends?: { id: number }[] | null;
  character_enemies?: { id: number }[] | null;
}

// Pide a Comic Vine aliados y enemigos de cada personaje del universo (1 petición por personaje)
// y escribe las parejas sugeridas para que una persona las revise.
async function main() {
  const apiKey = process.env.COMIC_VINE_API_KEY;
  if (!apiKey) {
    console.error("Falta COMIC_VINE_API_KEY. Ejecuta el script con: npm run relationships:suggest");
    process.exit(1);
  }

  const client = new ComicVineClient({ apiKey });
  const universe = JSON.parse(await readFile("data/universe.json", "utf8")) as UniverseFile;

  const characters = [];
  for (const entry of universe.characters) {
    const { results: c } = await client.get<CvCharacterLinks>(`character/4005-${entry.id}`, {
      field_list: "id,name,character_friends,character_enemies",
    });
    const friends = (c.character_friends ?? []).map((f) => f.id);
    const enemies = (c.character_enemies ?? []).map((e) => e.id);
    characters.push({ id: c.id, label: entry.label ?? c.name, friends, enemies });
    console.log(`  ${entry.label ?? c.name}: ${friends.length} aliados, ${enemies.length} enemigos en Comic Vine`);
  }

  const suggestions = buildRelationshipSuggestions(characters);
  await writeFile(OUTPUT, JSON.stringify(suggestions, null, 2) + "\n");

  const count = (type: string) => suggestions.filter((s) => s.type === type).length;
  console.log(
    `\n${suggestions.length} parejas dentro del universo: ${count("ALLY")} aliados, ` +
      `${count("ENEMY")} enemigos, ${count("CONFLICT")} en conflicto. Guardado en ${OUTPUT}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
