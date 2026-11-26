import { useCallback, useEffect, useMemo, useState } from "react";
import type { Card } from "../domain/card";
import { openSheets } from "./Sheet";

/** Selection mode over the shown cards: `selected` is null outside the mode, else the chosen ids. `chosen` is that set restricted to what the search and filters still show. */
export function useSelection(shown: Card[]) {
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const selecting = selected !== null;

  const cancel = useCallback(() => setSelected(null), []);

  // Android back leaves selection mode before it leaves the screen; a sheet opened later closes first.
  useEffect(() => {
    if (!selecting) return;
    openSheets.push(cancel);
    return () => void openSheets.splice(openSheets.lastIndexOf(cancel), 1);
  }, [selecting, cancel]);

  const begin = useCallback(() => setSelected((s) => s ?? new Set()), []);
  const add = useCallback((card: Card) => setSelected((s) => new Set(s).add(card.id)), []);
  const toggle = useCallback((card: Card) => {
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(card.id)) next.add(card.id);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => setSelected(new Set(shown.map((c) => c.id))), [shown]);
  const chosen = useMemo(() => shown.filter((c) => selected?.has(c.id)), [shown, selected]);

  return { selecting, selected: selected ?? undefined, chosen, begin, add, toggle, selectAll, cancel };
}
