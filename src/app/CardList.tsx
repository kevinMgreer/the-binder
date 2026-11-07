import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import type { Card } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";
import { useThumbUrl } from "./hooks";

const ROW_HEIGHT = 72;

function Thumb({ card }: { card: Card }) {
  const url = useThumbUrl(card.id, "front", !!card.photos.front, card.updatedAt);
  return url ? <img className="thumb" src={url} alt="" /> : <span className="thumb" aria-hidden="true" />;
}

export function CardList({ cards, onOpen }: { cards: Card[]; onOpen: (card: Card) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  useEffect(() => {
    if (performance.getEntriesByName("collection-first-render").length === 0) performance.mark("collection-first-render");
  }, []);

  return (
    <div ref={scroller} className="list-scroller">
      <ul style={{ height: virtualizer.getTotalSize() }} className="list">
        {virtualizer.getVirtualItems().map((item) => {
          const c = cards[item.index];
          const serial = serialLabel(c.parallel);
          const grade = c.grading.kind === "graded" ? gradeLabel(c.grading) : "";
          return (
            <li
              key={c.id}
              data-testid="card-row"
              style={{ height: ROW_HEIGHT, transform: `translateY(${item.start}px)` }}
            >
              <button onClick={() => onOpen(c)}>
                <Thumb card={c} />
                <span className="text">
                  <strong>{c.player}</strong>
                  <span>
                    {c.year} {c.set} #{c.cardNumber}
                  </span>
                  <span>
                    {[c.parallel?.name, serial, grade, c.quantity > 1 && `×${c.quantity}`].filter(Boolean).join(" ")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
