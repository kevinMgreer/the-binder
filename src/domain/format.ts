import type { Card } from "./card";

export function serialLabel(parallel: Card["parallel"]): string | null {
  if (!parallel) return null;
  const serial = parallel.serialLegible && parallel.serial !== null ? String(parallel.serial) : null;
  return parallel.printRun === null ? serial : `${serial ?? "?"}/${parallel.printRun}`;
}

export function gradeLabel(grading: Card["grading"]): string {
  return grading.kind === "graded" ? `${grading.company} ${grading.grade}` : grading.condition;
}

export function isSerialNumbered(card: Card): boolean {
  return card.parallel !== null && (card.parallel.serial !== null || card.parallel.printRun !== null);
}
