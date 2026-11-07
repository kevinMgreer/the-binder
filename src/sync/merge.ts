import type { Card } from "../domain/card";

export const TOMBSTONE_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function pick(a: Card, b: Card): Card {
  const timeA = Date.parse(a.updatedAt);
  const timeB = Date.parse(b.updatedAt);
  if (timeA !== timeB) return timeA > timeB ? a : b;
  // Same timestamp: choose by a fixed rule so every install converges on the same card.
  if ((a.deletedAt === null) !== (b.deletedAt === null)) return a.deletedAt !== null ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

/** Union by id; for the same id the latest `updatedAt` wins, tombstones included. Returns the input objects, not copies. */
export function merge(local: Card[], remote: Card[]): Card[] {
  const byId = new Map<string, Card>();
  for (const card of [...local, ...remote]) {
    const existing = byId.get(card.id);
    byId.set(card.id, existing ? pick(existing, card) : card);
  }
  return [...byId.values()];
}

export function purgeTombstones(cards: Card[], now: Date): Card[] {
  const cutoff = now.getTime() - TOMBSTONE_DAYS * DAY_MS;
  return cards.filter((c) => c.deletedAt === null || Date.parse(c.deletedAt) >= cutoff);
}
