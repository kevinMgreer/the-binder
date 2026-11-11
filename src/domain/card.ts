export interface PhotoRef {
  fileId: string | null;
  thumbId: string | null;
  name: string | null;
}

export type Grading =
  | { kind: "graded"; company: string; grade: string }
  | { kind: "raw"; condition: string };

export const CONDITIONS = ["Mint", "Near Mint", "Excellent", "Very Good", "Good", "Fair", "Poor"] as const;

export interface Card {
  id: string;
  player: string;
  team: string;
  year: number;
  manufacturer: string;
  set: string;
  subset?: string;
  sortName?: string;
  insert?: string;
  cardNumber: string;
  parallel: {
    name: string;
    /** Absent on cards saved before the mark existed: then a serial or a print run counts as serial-numbered. */
    serialNumbered?: boolean;
    serial: number | null;
    serialLegible: boolean;
    printRun: number | null;
  } | null;
  flags: { rookie: boolean; autograph: boolean; relic: boolean };
  grading: Grading;
  quantity: number;
  notes: string;
  photos: { front: PhotoRef | null; back: PhotoRef | null };
  source: "manual" | "ocr" | "claude";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CollectionFile {
  schemaVersion: 1 | 2;
  updatedAt: string;
  cards: Card[];
}

export type CardSide = "front" | "back";

export type Suggestion = Partial<
  Pick<Card, "player" | "team" | "year" | "manufacturer" | "set" | "cardNumber" | "parallel">
> & {
  lowConfidence?: string[];
};
