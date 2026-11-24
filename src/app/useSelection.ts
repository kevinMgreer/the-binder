import { useCallback, useEffect, useMemo, useState } from "react";
import type { Card } from "../domain/card";
import { openSheets } from "./Sheet";

/** Selection mode over the shown cards. `chosen` is the selection restricted to what the search and filters still show. */
export function useSelection(shown: Card[]) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const cancel = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);

  // Android back leaves selection mode before it leaves the screen; a sheet opened later closes first.
  useEffect(() => {
    if (!selecting) return;
    openSheets.push(cancel);
    return () => void openSheets.splice(openSheets.lastIndexOf(cancel), 1);
  }, [selecting, cancel]);

  const begin = useCallback(() => setSelecting(true), []);
  const add = useCallback((card: Card) => {
    setSelecting(true);
    setSelected((s) => new Set(s).add(card.id));
  }, []);
  const toggle = useCallback((card: Card) => {
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(card.id)) next.add(card.id);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => setSelected(new Set(shown.map((c) => c.id))), [shown]);
  const chosen = useMemo(() => shown.filter((c) => selected.has(c.id)), [shown, selected]);

  return { selecting, selected, chosen, begin, add, toggle, selectAll, cancel };
}
