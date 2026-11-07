import { useCallback, useEffect, useState } from "react";
import type { Card, CardSide } from "../domain/card";
import type { Photos } from "../ports";
import { usePorts } from "./ports-context";

const SIDES: CardSide[] = ["front", "back"];

export function useCards() {
  const { collection, photos: photoStore } = usePorts();
  const [cards, setCards] = useState<Card[]>([]);

  const refresh = useCallback(async () => {
    const all = await collection.list();
    setCards(all.filter((c) => c.deletedAt === null));
  }, [collection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (card: Card, photos: Photos = {}) => {
      let next = card;
      for (const side of SIDES) {
        const photo = photos[side];
        if (!photo) continue;
        const old = (await collection.get(card.id))?.photos[side];
        for (const id of [old?.fileId, old?.thumbId]) if (id) await photoStore.queueDelete(id);
        await photoStore.saveCaptured(card.id, side, photo);
        next = { ...next, photos: { ...next.photos, [side]: { fileId: null, thumbId: null } } };
      }
      await collection.put(next);
      await refresh();
    },
    [collection, photoStore, refresh],
  );

  const remove = useCallback(
    (card: Card) => {
      const now = new Date().toISOString();
      return save({ ...card, deletedAt: now, updatedAt: now });
    },
    [save],
  );

  return { cards, save, remove };
}
