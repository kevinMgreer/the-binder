import { useCallback, useEffect, useState } from "react";
import type { Card } from "../domain/card";
import { usePorts } from "./ports-context";

export function useCards() {
  const { collection } = usePorts();
  const [cards, setCards] = useState<Card[]>([]);

  const refresh = useCallback(async () => {
    const all = await collection.list();
    setCards(all.filter((c) => c.deletedAt === null));
  }, [collection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (card: Card) => {
      await collection.put(card);
      await refresh();
    },
    [collection, refresh],
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
