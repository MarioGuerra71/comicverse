export type ReadingStatus = "PENDING" | "READING" | "READ" | "DROPPED";

export interface LibraryEntryState {
  status: ReadingStatus;
  startedAt: Date | null;
  readAt: Date | null;
}

export interface StatusChange {
  next: LibraryEntryState;
  changed: boolean;
  /** El cómic acaba de pasar a Leído: aquí se desbloquearán personajes (Fase 5). */
  becameRead: boolean;
  /** El cómic dejó de estar Leído: aquí habrá que reajustar desbloqueos (Fase 5). */
  stoppedBeingRead: boolean;
}

/**
 * Calcula el resultado de poner un cómic en un estado.
 * `current` es null si el cómic aún no estaba en la biblioteca.
 */
export function applyStatusChange(
  current: LibraryEntryState | null,
  status: ReadingStatus,
  now: Date,
): StatusChange {
  if (current && current.status === status) {
    return { next: current, changed: false, becameRead: false, stoppedBeingRead: false };
  }

  const startedAt =
    status === "READING"
      ? (current?.startedAt ?? now)
      : (current?.startedAt ?? null);

  const readAt = status === "READ" ? now : null;

  return {
    next: { status, startedAt, readAt },
    changed: true,
    becameRead: status === "READ",
    stoppedBeingRead: current?.status === "READ" && status !== "READ",
  };
}