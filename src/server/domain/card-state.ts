export type CardState = "LOCKED" | "DISCOVERED" | "COLLECTED";

// A partir de cuántos cómics leídos una carta pasa a "desarrollada"
export const COLLECTED_THRESHOLD = 5;

export function getCardState(comicsRead: number): CardState {
  if (comicsRead <= 0) return "LOCKED";
  if (comicsRead >= COLLECTED_THRESHOLD) return "COLLECTED";
  return "DISCOVERED";
}