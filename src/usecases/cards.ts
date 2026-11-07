import type { Card, CardSide } from "../domain/card";
import type { CollectionStore, PhotoStore, Photos } from "../ports";

const SIDES: CardSide[] = ["front", "back"];

interface Deps {
  collection: CollectionStore;
  photos: PhotoStore;
}

export async function saveCard({ collection, photos: store }: Deps, card: Card, photos: Photos = {}) {
  let next = card;
  for (const side of SIDES) {
    const photo = photos[side];
    if (!photo) continue;
    const old = (await collection.get(card.id))?.photos[side];
    for (const id of [old?.fileId, old?.thumbId]) if (id) await store.queueDelete(id);
    await store.saveCaptured(card.id, side, photo);
    next = { ...next, photos: { ...next.photos, [side]: { fileId: null, thumbId: null, name: null } } };
  }
  await collection.put(next);
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
