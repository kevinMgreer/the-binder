import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, type RefObject } from "react";
import type { Card } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";
import { Thumb } from "./Thumb";

// Fits the 96 dp thumbnail slot centred in the button (row minus the li's 8 dp bottom padding, the gap to the next row).
const ROW_HEIGHT = 112;

/** On mount, scrolls the card the user came back from into view and focuses its button once it is rendered. Rows and tiles carry `data-index`. */
export function useReturnTo(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  cards: Card[],
  returnTo: string | undefined,
  scroller: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const index = cards.findIndex((c) => c.id === returnTo);
    if (index < 0) return;
    virtualizer.scrollToIndex(index, { align: "auto" });
    let frame = 0;
    let tries = 0;
    const focus = () => {
      const button = scroller.current?.querySelector<HTMLElement>(`[data-index="${index}"] button`);
      if (button) button.focus({ preventScroll: true });
      else if (++tries < 30) frame = requestAnimationFrame(focus);
    };
    focus();
    return () => cancelAnimationFrame(frame);
    // Only on mount: the screen is remounted each time the user comes back.
  }, []);
}

export function CardList({ cards, onOpen, returnTo }: { cards: Card[]; onOpen: (card: Card) => void; returnTo?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });
  useReturnTo(virtualizer, cards, returnTo, scroller);

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
              data-index={item.index}
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
                    </span>
                    {c.cardNumber && (
                      <>
                        {" "}
                        <span className="num">· #{c.cardNumber}</span>
                      </>
                    )}
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
