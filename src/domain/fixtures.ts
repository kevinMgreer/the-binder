import type { Card } from "./card";

export function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: crypto.randomUUID(),
    player: "Ronald Acuña Jr.",
    team: "Atlanta Braves",
    year: 2024,
    manufacturer: "Topps",
    set: "Series 1",
    cardNumber: "27",
    parallel: null,
    flags: { rookie: false, autograph: false, relic: false },
    grading: { kind: "raw", condition: "" },
    quantity: 1,
    notes: "",
    photos: { front: null, back: null },
    source: "manual",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}
