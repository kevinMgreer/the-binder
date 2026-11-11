import type { Card } from "./card";

function marked(parallel: Card["parallel"]): boolean {
  return !!parallel && (parallel.serialNumbered ?? (parallel.serial !== null || parallel.printRun !== null));
}

export function serialLabel(parallel: Card["parallel"]): string | null {
  if (!parallel || !marked(parallel)) return null;
  const serial = parallel.serialLegible && parallel.serial !== null ? String(parallel.serial) : null;
  return parallel.printRun === null ? serial : `${serial ?? "?"}/${parallel.printRun}`;
}

export function gradeLabel(grading: Card["grading"]): string {
  return grading.kind === "graded" ? `${grading.company} ${grading.grade}` : grading.condition;
}

export function isSerialNumbered(card: Card): boolean {
  return marked(card.parallel);
}
