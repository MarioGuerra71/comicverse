// Tipos de relación curada y su nombre para mostrar (compartido cliente/servidor).
// Añadir un tipo = añadirlo aquí (se guarda como texto: no hace falta migración).
export const RELATIONSHIP_TYPE_LABELS = {
  ALLY: "Aliado",
  ENEMY: "Enemigo",
  FAMILY: "Familia",
  PARTNER: "Pareja",
  COMPANION: "Compañero",
  RIVAL: "Rival",
} as const;

export type RelationshipType = keyof typeof RELATIONSHIP_TYPE_LABELS;

export const RELATIONSHIP_TYPES = Object.keys(RELATIONSHIP_TYPE_LABELS) as RelationshipType[];
