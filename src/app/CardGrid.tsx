import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Card } from "../domain/card";
import { useCardPress, SelectMark, type PressProps } from "./card-press";
import { useReturnTo } from "./CardList";
import { Thumb } from "./Thumb";

// A tile-height guess at 360 dp (3 columns); drawn tiles are measured, tiles not yet drawn keep this estimate.
const ESTIMATE = 190;
const WIDE = "(min-width: 480px)";

/** 3 columns on a phone, 4 from 480 dp. */
function useColumns() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const onChange = () => setWide(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return wide ? 4 : 3;
}

const accessibleName = (c: Card) =>
  [c.player, `${c.year} ${c.set}`, c.cardNumber && `number ${c.cardNumber}`, c.quantity > 1 && `${c.quantity} copies`, c.wanted && "wanted"].filter(Boolean).join(", ");

export function CardGrid({ cards, returnTo, ...press }: { cards: Card[]; returnTo?: string } & PressProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const pressProps = useCardPress(press);
  const lanes = useColumns();
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => ESTIMATE,
    overscan: 8,
    lanes,
  });

  useReturnTo(virtualizer, cards, returnTo, scroller);

  useEffect(() => {
    if (performance.getEntriesByName("collection-first-render").length === 0) performance.mark("collection-first-render");
  }, []);

  return (
    <div ref={scroller} className="list-scroller">
      <ul role="list" style={{ height: virtualizer.getTotalSize(), "--cols": lanes } as CSSProperties} className="list grid">
        {virtualizer.getVirtualItems().map((item) => {
          const c = cards[item.index];
          return (
            <li
              key={c.id}
              data-testid="card-tile"
              data-index={item.index}
              className={press.selected ? "selecting" : undefined}
              ref={virtualizer.measureElement}
              style={{ "--lane": item.lane, transform: `translateY(${item.start}px)` } as CSSProperties}
            >
              <button className="grid-card" aria-label={accessibleName(c)} {...pressProps(c)}>
                <Thumb card={c} />
                <span className="grid-caption">
                  <span className="grid-name">{c.player}</span>
                  <span className="grid-meta">
                    <span className="grid-year">{c.year}</span>
                    {c.quantity > 1 && <span className="badge">×{c.quantity}</span>}
                  </span>
                  {c.wanted && <span className="tag grid-wanted">Wanted</span>}
                </span>
              </button>
              {press.selected && <SelectMark on={press.selected.has(c.id)} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
