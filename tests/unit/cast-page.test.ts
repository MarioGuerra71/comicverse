import { describe, expect, it } from "vitest";
import { packGroups, toCastPage, type CollectionCardDto } from "@/server/dto/character";

const card = (id: string): CollectionCardDto => ({
  id,
  name: id,
  imageThumbUrl: null,
  number: null,
  realName: null,
  state: "DISCOVERED",
  comicsRead: 1,
  isFavorite: false,
  isNew: false,
});

const cards = ["spidey", "goblin", "mj", "harry"].map(card);
const rel = (a: string, b: string, type: string | null, shared: number) => ({ a, b, type, shared });
const relationships = [
  rel("spidey", "goblin", "ENEMY", 40),
  rel("spidey", "mj", "PARTNER", 90),
  rel("spidey", "harry", null, 12),
  rel("goblin", "harry", "FAMILY", 30),
  rel("spidey", "venom-bloqueado", "ENEMY", 50),
];

describe("toCastPage", () => {
  it("sin protagonista pedido, elige al más conectado y agrupa por tipo en orden", () => {
    const page = toCastPage(cards, relationships)!;
    expect(page.focus?.id).toBe("spidey");
    expect(page.groups.map((g) => g.key)).toEqual(["ENEMY", "PARTNER", "TOGETHER"]);
    expect(page.groups[0].members).toEqual([{ card: cards[1], shared: 40 }]);
    expect(page.cast.map((c) => c.id)).toEqual(["spidey", "goblin", "harry", "mj"]);
    expect(page.relationships).toEqual({ discovered: 4, total: 5 });
  });

  it("de un personaje bloqueado solo cuenta el número, sin datos", () => {
    const page = toCastPage(cards, relationships)!;
    expect(page.hidden).toBe(1);
    expect(JSON.stringify(page)).not.toContain("venom");
  });

  it("con protagonista pedido muestra el suyo; si está bloqueado, null", () => {
    expect(toCastPage(cards, relationships, "goblin")!.groups.map((g) => g.key)).toEqual(["ENEMY", "FAMILY"]);
    expect(toCastPage(cards, relationships, "venom-bloqueado")).toBeNull();
  });

  it("sin nadie desbloqueado no hay protagonista", () => {
    expect(toCastPage([], relationships)).toMatchObject({ focus: null, groups: [], cast: [] });
  });
});

describe("packGroups", () => {
  const g = (key: string, n: number) => ({ key, members: Array.from({ length: n }) });
  it("rellena cada fila con los siguientes grupos que caben, en su orden", () => {
    const groups = [g("aliados", 2), g("enemigos", 6), g("familia", 1), g("pareja", 3), g("compañeros", 1), g("rivales", 1)];
    expect(packGroups(groups, 5).map((x) => x.key)).toEqual([
      "aliados", "familia", "compañeros", "rivales", // 2+1+1+1 = 5
      "enemigos", // 6 → ocupa la fila entera
      "pareja",
    ]);
  });
});
