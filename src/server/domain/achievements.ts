// Logros: reglas puras sobre las estadísticas del usuario (sin BD). Un logro conseguido se
// guarda con su fecha (UserAchievement) y no se pierde aunque luego bajen las cifras.

export interface AchievementStats {
  read: number;
  /** Décadas distintas (1960, 1970…) de los cómics leídos. */
  decades: number;
  readMarvel: number;
  readDc: number;
  unlocked: number;
  collected: number;
  /** Mejor porcentaje de un álbum de al menos MIN_ALBUM_SIZE cromos (0–100). */
  bestAlbumPercent: number;
  /** Editoriales (zonas) con algún álbum en la biblioteca. */
  zonesWithAlbums: number;
  unlockedMarvel: number;
  unlockedDc: number;
}

export type AchievementGroup = "READING" | "COLLECTION" | "PUBLISHERS";

export interface AchievementDefinition {
  id: string;
  group: AchievementGroup;
  title: string;
  description: string;
  /** Oculto como «???» hasta conseguirlo. */
  secret?: boolean;
  target: number;
  value: (s: AchievementStats) => number;
}

/** Un álbum cuenta para «medio álbum» y «álbum completo» si tiene al menos estos cromos. */
export const MIN_ALBUM_SIZE = 9;

const count = (
  id: string,
  group: AchievementGroup,
  title: string,
  description: string,
  target: number,
  value: (s: AchievementStats) => number,
  secret = false,
): AchievementDefinition => ({ id, group, title, description, target, value, secret });

export const ACHIEVEMENTS: AchievementDefinition[] = [
  count("read-1", "READING", "Primera viñeta", "Lee tu primer cómic.", 1, (s) => s.read),
  count("read-10", "READING", "Lector habitual", "Lee 10 cómics.", 10, (s) => s.read),
  count("read-50", "READING", "Ratón de biblioteca", "Lee 50 cómics.", 50, (s) => s.read),
  count("read-100", "READING", "Centenario", "Lee 100 cómics.", 100, (s) => s.read),
  count("read-500", "READING", "Leyenda de la grapa", "Lee 500 cómics.", 500, (s) => s.read),
  count("decades-5", "READING", "Viajero en el tiempo", "Lee cómics de 5 décadas distintas.", 5, (s) => s.decades, true),

  count("unlock-1", "COLLECTION", "Primer descubrimiento", "Descubre a tu primer personaje.", 1, (s) => s.unlocked),
  count("unlock-25", "COLLECTION", "Reparto", "Descubre a 25 personajes.", 25, (s) => s.unlocked),
  count("unlock-100", "COLLECTION", "Multitud", "Descubre a 100 personajes.", 100, (s) => s.unlocked),
  count("unlock-250", "COLLECTION", "Universo poblado", "Descubre a 250 personajes.", 250, (s) => s.unlocked),
  count("collected-1", "COLLECTION", "Coleccionista", "Colecciona a un personaje (5 cómics leídos con él).", 1, (s) => s.collected),
  count("album-50", "COLLECTION", "Medio álbum", "Completa la mitad de un álbum.", 50, (s) => s.bestAlbumPercent),
  count("album-100", "COLLECTION", "Álbum completo", "Completa un álbum entero.", 100, (s) => s.bestAlbumPercent, true),

  count("marvel-1", "PUBLISHERS", "La Casa de las Ideas", "Lee tu primer cómic de Marvel.", 1, (s) => s.readMarvel),
  count("dc-1", "PUBLISHERS", "Al otro lado", "Lee tu primer cómic de DC.", 1, (s) => s.readDc),
  count("zones-2", "PUBLISHERS", "Dos universos", "Ten álbumes de Marvel y de DC.", 2, (s) => s.zonesWithAlbums),
  count(
    "crossover-25",
    "PUBLISHERS",
    "Cruce de universos",
    "Descubre a 25 personajes en cada editorial.",
    25,
    (s) => Math.min(s.unlockedMarvel, s.unlockedDc),
    true,
  ),
];

export interface AchievementProgress {
  id: string;
  current: number;
  target: number;
  done: boolean;
}

/** Progreso de cada logro (current nunca pasa del objetivo). */
export function evaluateAchievements(stats: AchievementStats): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => {
    const current = Math.min(a.value(stats), a.target);
    return { id: a.id, current, target: a.target, done: current >= a.target };
  });
}
