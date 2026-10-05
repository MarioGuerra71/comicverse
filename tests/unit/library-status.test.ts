import { describe, it, expect } from "vitest";
import { applyStatusChange } from "@/server/domain/library-status";

const NOW = new Date("2026-10-03T10:00:00Z");
const EARLIER = new Date("2026-09-01T10:00:00Z");

describe("applyStatusChange", () => {
  it("añadir como Pendiente no marca fechas ni lectura", () => {
    const change = applyStatusChange(null, "PENDING", NOW);

    expect(change.changed).toBe(true);
    expect(change.becameRead).toBe(false);
    expect(change.next).toEqual({ status: "PENDING", startedAt: null, readAt: null });
  });

  it("pasar a Leyendo guarda la fecha de inicio", () => {
    const change = applyStatusChange(null, "READING", NOW);

    expect(change.next.startedAt).toEqual(NOW);
    expect(change.becameRead).toBe(false);
  });

  it("volver a Leyendo conserva el inicio original", () => {
    const current = { status: "DROPPED" as const, startedAt: EARLIER, readAt: null };

    expect(applyStatusChange(current, "READING", NOW).next.startedAt).toEqual(EARLIER);
  });

  it("pasar a Leído marca la lectura y la fecha", () => {
    const current = { status: "READING" as const, startedAt: EARLIER, readAt: null };

    const change = applyStatusChange(current, "READ", NOW);

    expect(change.becameRead).toBe(true);
    expect(change.next).toEqual({ status: "READ", startedAt: EARLIER, readAt: NOW });
  });

  it("marcar Leído directamente desde fuera de la biblioteca también cuenta como lectura", () => {
    const change = applyStatusChange(null, "READ", NOW);

    expect(change.becameRead).toBe(true);
    expect(change.next.readAt).toEqual(NOW);
    expect(change.next.startedAt).toBeNull();
  });

  it("marcar Leído dos veces no cambia nada ni repite la lectura", () => {
    const current = { status: "READ" as const, startedAt: null, readAt: EARLIER };

    const change = applyStatusChange(current, "READ", NOW);

    expect(change.changed).toBe(false);
    expect(change.becameRead).toBe(false);
    expect(change.next).toBe(current);
  });

  it("dejar de estar Leído borra la fecha de lectura y lo avisa", () => {
    const current = { status: "READ" as const, startedAt: EARLIER, readAt: EARLIER };

    const change = applyStatusChange(current, "DROPPED", NOW);

    expect(change.stoppedBeingRead).toBe(true);
    expect(change.becameRead).toBe(false);
    expect(change.next).toEqual({ status: "DROPPED", startedAt: EARLIER, readAt: null });
  });

  it("pasar de Pendiente a Abandonado no es ni leer ni dejar de leer", () => {
    const current = { status: "PENDING" as const, startedAt: null, readAt: null };

    const change = applyStatusChange(current, "DROPPED", NOW);

    expect(change.changed).toBe(true);
    expect(change.becameRead).toBe(false);
    expect(change.stoppedBeingRead).toBe(false);
  });
});