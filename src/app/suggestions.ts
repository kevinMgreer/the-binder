import type { Suggestion } from "../domain/card";

export type DraftKey =
  | "player"
  | "team"
  | "year"
  | "manufacturer"
  | "set"
  | "cardNumber"
  | "parallel"
  | "serial"
  | "serialUnreadable"
  | "printRun";

export type SuggestionPatch = Partial<Record<DraftKey, string | boolean>>;

export function suggestionPatch(s: Suggestion): SuggestionPatch {
  const patch: SuggestionPatch = {};
  if (s.player) patch.player = s.player;
  if (s.team) patch.team = s.team;
  if (s.year !== undefined) patch.year = String(s.year);
  if (s.manufacturer) patch.manufacturer = s.manufacturer;
  if (s.set) patch.set = s.set;
  if (s.cardNumber) patch.cardNumber = s.cardNumber;
  if (s.parallel) {
    if (s.parallel.name) patch.parallel = s.parallel.name;
    if (s.parallel.serial !== null) patch.serial = String(s.parallel.serial);
    if (s.parallel.printRun !== null) patch.printRun = String(s.parallel.printRun);
    if (!s.parallel.serialLegible) patch.serialUnreadable = true;
  }
  return patch;
}

/** Form fields to flag for review; a doubtful parallel makes all its fields doubtful. */
export function flaggedKeys(s: Suggestion): DraftKey[] {
  return (s.lowConfidence ?? []).flatMap((name) =>
    name === "parallel" ? (["parallel", "serial", "printRun"] as DraftKey[]) : [name as DraftKey],
  );
}
