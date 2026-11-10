import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import type { Card } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";
import { useThumbUrl } from "./hooks";

// Fits the 67 dp thumbnail, the button's 12 dp padding and the 8 dp gap to the next row (the li's bottom padding).
const ROW_HEIGHT = 100;

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
          const rest = [c.parallel?.name, grade, c.quantity > 1 && `×${c.quantity}`].filter(Boolean).join(" ");
          return (
            <li
              key={c.id}
              data-testid="card-row"
              style={{ height: ROW_HEIGHT, transform: `translateY(${item.start}px)` }}
            >
              <button onClick={() => onOpen(c)}>
                <Thumb card={c} />
                <span className="text">
                  <span className="head">
                    <strong className="player">{c.player}</strong>
                    {serial && <span className="tag">{serial}</span>}
                  </span>
                  <span className="quiet">
                    <span className="set">
                      {c.year} {c.set}
                    </span>{" "}
                    <span className="num">· #{c.cardNumber}</span>
                    {rest && (
                      <>
                        {" "}
                        <span className="rest">· {rest}</span>
                      </>
                    )}
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
