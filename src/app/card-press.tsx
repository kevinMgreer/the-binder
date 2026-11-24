import { useRef, type MouseEvent, type PointerEvent } from "react";
import type { Card } from "../domain/card";
import { Icon } from "./Icon";

const LONG_PRESS_MS = 500;
const MOVE_PX = 10;

/** The check on a selected row or tile; the tint alone would be colour only. */
export const SelectedMark = () => (
  <span className="selected-mark">
    <Icon name="check" />
  </span>
);

export interface PressProps {
  selected?: Set<string>;
  onOpen: (card: Card) => void;
  onToggle?: (card: Card) => void;
  onLongPress?: (card: Card) => void;
}

/** Button props for a row or tile: tap opens (or toggles while selecting), a long press starts selection and swallows its click. */
export function useCardPress({ selected, onOpen, onToggle, onLongPress }: PressProps) {
  const timer = useRef(0);
  const fired = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const clear = () => window.clearTimeout(timer.current);

  return (card: Card) => ({
    "aria-pressed": selected ? selected.has(card.id) : undefined,
    onPointerDown: (e: PointerEvent) => {
      fired.current = false;
      if (!onLongPress) return;
      origin.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress(card);
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e: PointerEvent) => {
      if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > MOVE_PX) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    // Android's text menu would otherwise open on a long press.
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onClick: () => {
      if (fired.current) fired.current = false;
      else if (selected) onToggle?.(card);
      else onOpen(card);
    },
  });
}
