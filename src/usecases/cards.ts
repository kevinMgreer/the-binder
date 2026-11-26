import type { Card, CardSide, Grading } from "../domain/card";
import type { CollectionStore, PhotoStore, Photos } from "../ports";

const SIDES: CardSide[] = ["front", "back"];

interface Deps {
  collection: CollectionStore;
  photos: PhotoStore;
}

export async function saveCard({ collection, photos: store }: Deps, card: Card, photos: Photos = {}) {
  const stored = await collection.get(card.id);
  // The form's photo refs can be stale: a background upload may have stored new ones since it opened.
  let next = stored ? { ...card, photos: stored.photos } : card;
  for (const side of SIDES) {
    const photo = photos[side];
    if (photo === undefined) continue;
    const old = stored?.photos[side];
    for (const id of [old?.fileId, old?.thumbId]) if (id) await store.queueDelete(id);
    // shortcut: a removed photo's local blobs stay until eviction or sign-out; add PhotoStore.remove if they matter.
    if (photo) await store.saveCaptured(card.id, side, photo);
    next = { ...next, photos: { ...next.photos, [side]: photo && { fileId: null, thumbId: null, name: null } } };
  }
  await collection.put(next);
}

/** Absent key means "Keep as is". No key exists for per-card fields, so a bulk change cannot touch them. */
export interface BulkPatch {
  team?: string;
  year?: number;
  manufacturer?: string;
  set?: string;
  subset?: string;
  insert?: string;
  parallelName?: string;
  rookie?: boolean;
  autograph?: boolean;
  relic?: boolean;
  grading?: Grading;
}

export function applyPatch(card: Card, patch: BulkPatch): Card {
  const { parallelName, rookie, autograph, relic, grading, ...fields } = patch;
  const next: Card = { ...card };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) Object.assign(next, { [key]: typeof value === "string" ? value.trim() : value });
  }
  const name = parallelName?.trim();
  if (name) {
    next.parallel = card.parallel
      ? { ...card.parallel, name }
      : { name, serialNumbered: false, serial: null, serialLegible: true, printRun: null };
  }
  next.flags = {
    rookie: rookie ?? card.flags.rookie,
    autograph: autograph ?? card.flags.autograph,
    relic: relic ?? card.flags.relic,
  };
  if (grading) next.grading = grading;
  return next;
}

export async function saveCards({ collection }: Pick<Deps, "collection">, ids: string[], patch: BulkPatch) {
  const wanted = new Set(ids);
  const now = new Date().toISOString();
  const changed: Card[] = [];
  for (const card of await collection.list()) {
    if (!wanted.has(card.id) || card.deletedAt !== null) continue;
    const next = applyPatch(card, patch);
    if (JSON.stringify(next) !== JSON.stringify(card)) changed.push({ ...next, updatedAt: now });
  }
  if (changed.length) await collection.putMany(changed);
  return changed.length;
}

export async function deleteCard({ collection, photos: store }: Deps, card: Card) {
  const stored = (await collection.get(card.id)) ?? card;
  for (const side of SIDES) {
    const ref = stored.photos[side];
    for (const id of [ref?.fileId, ref?.thumbId]) if (id) await store.queueDelete(id);
  }
  const now = new Date().toISOString();
  await collection.put({ ...stored, deletedAt: now, updatedAt: now });
}

/** Deletes each card on its own so one failure leaves the others deleted; returns the ids that failed. */
export async function deleteCards(deps: Deps, cards: Card[]): Promise<string[]> {
  const failed: string[] = [];
  for (const card of cards) {
    try {
      await deleteCard(deps, card);
    } catch {
      failed.push(card.id);
    }
  }
  return failed;
}
