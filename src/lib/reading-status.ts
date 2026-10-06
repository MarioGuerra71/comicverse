// Nombres para mostrar de los estados de lectura (compartido cliente/servidor).
export const READING_STATUS_LABELS = {
  PENDING: "Pendiente",
  READING: "Leyendo",
  READ: "Leído",
  DROPPED: "Abandonado",
} as const;

export type ReadingStatusKey = keyof typeof READING_STATUS_LABELS;

export const READING_STATUSES = Object.keys(READING_STATUS_LABELS) as ReadingStatusKey[];
