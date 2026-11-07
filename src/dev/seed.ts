import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";

export function seedCards(count: number): Card[] {
  return Array.from({ length: count }, (_, i) =>
    makeCard({
      player: `Player ${i}`,
      team: `Team ${i % 30}`,
      year: 1990 + (i % 36),
      set: `Set ${i % 40}`,
      cardNumber: String(i + 1),
    }),
  );
}
