import { useCallback, useEffect, useState } from "react";
import type { Card } from "../domain/card";
import type { Photos } from "../ports";
import { deleteCard, saveCard } from "../usecases/cards";
import { usePorts } from "./ports-context";
import { useSync } from "./sync-context";

export function useCards() {
  const { collection, photos } = usePorts();
  const sync = useSync();
  const [cards, setCards] = useState<Card[]>([]);

  const refresh = useCallback(async () => {
    const all = await collection.list();
    setCards(all.filter((c) => c.deletedAt === null));
  }, [collection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A finished sync may have pulled cards from another install.
  useEffect(
    () =>
      sync.subscribe((status) => {
        if (status.state === "idle") void refresh();
      }),
    [sync, refresh],
  );

  const save = useCallback(
    async (card: Card, newPhotos?: Photos) => {
      await saveCard({ collection, photos }, card, newPhotos);
      await refresh();
      sync.notifyChange();
    },
    [collection, photos, refresh, sync],
  );

  const remove = useCallback(
    async (card: Card) => {
      await deleteCard({ collection, photos }, card);
      await refresh();
      sync.notifyChange();
    },
    [collection, photos, refresh, sync],
  );

  return { cards, save, remove };
}
