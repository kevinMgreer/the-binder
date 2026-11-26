import { useCallback, useRef, useState, type ReactNode } from "react";
import type { Card, CardSide } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";
import { Frame } from "./Frame";
import { useThumbUrl } from "./hooks";
import { PhotoView } from "./PhotoView";
import { ConfirmDialog } from "./ConfirmDialog";
import { Sheet } from "./Sheet";

interface Props {
  card: Card;
  onEdit: () => void;
  onMarkOwned: () => void;
  onDelete: () => Promise<void>;
}

const SIDES: CardSide[] = ["front", "back"];

function PhotoThumb({ card, side, onOpen }: { card: Card; side: CardSide; onOpen: () => void }) {
  const thumb = useThumbUrl(card.id, side, true, card.updatedAt);
  const full = useThumbUrl(card.id, side, true, card.updatedAt, "full");
  const url = full ?? thumb;
  return (
    <button className="photo-thumb" aria-label={`View ${side} photo`} onClick={onOpen}>
      <Frame url={url} cacheKey={`${card.id}:${side}:${card.updatedAt}`} />
    </button>
  );
}

export function CardDetail({ card, onEdit, onDelete, onMarkOwned }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [viewing, setViewing] = useState<CardSide | null>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const keep = useCallback(() => {
    setConfirming(false);
    deleteButton.current?.focus();
  }, []);
  const serial = serialLabel(card.parallel);
  const flags = [card.flags.rookie && "Rookie", card.flags.autograph && "Autograph", card.flags.relic && "Relic"].filter(Boolean);
  const facts: Array<[string, ReactNode]> = [
    ["Manufacturer", card.manufacturer],
    ["Subset", card.subset],
    ["Insert", card.insert],
    ["Team", card.team],
    ["Parallel", card.parallel?.name],
    ["Condition", gradeLabel(card.grading)],
    ["Quantity", card.quantity],
    ["Traits", flags.join(", ")],
  ].filter(([, v]) => v) as Array<[string, ReactNode]>;

  return (
    <section>
      <header className="detail-head">
        <div className="title-row">
          <h2>{card.player}</h2>
          {serial && <span className="tag">{serial}</span>}
          {card.wanted && <span className="tag">Wanted</span>}
        </div>
        <p className="subtitle" data-testid="subtitle">
          {card.year} {card.set}
          {card.cardNumber && ` · #${card.cardNumber}`}
        </p>
      </header>
      <div className="title-rule" aria-hidden="true" />
      <dl className="facts" data-testid="facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {card.notes && <p>{card.notes}</p>}
      <div className="photo-row">
        {SIDES.map((side) => card.photos[side] && <PhotoThumb key={side} card={card} side={side} onOpen={() => setViewing(side)} />)}
      </div>
      {viewing && (
        <Sheet
          label={`${viewing === "front" ? "Front" : "Back"} photo view`}
          onClose={() => setViewing(null)}
          hideTitle
        >
          <PhotoView
            key={viewing}
            card={card}
            side={viewing}
            onSwipe={
              card.photos.front && card.photos.back
                ? (direction) => {
                    if (direction === "left" && viewing === "front") setViewing("back");
                    if (direction === "right" && viewing === "back") setViewing("front");
                  }
                : undefined
            }
          />
          {card.photos.front && card.photos.back && (
            <div className="photo-dots">
              {SIDES.map((side) => (
                <button key={side} aria-label={side === "front" ? "Front" : "Back"} aria-pressed={viewing === side} onClick={() => setViewing(side)} />
              ))}
            </div>
          )}
        </Sheet>
      )}
      <p>
        Last edited <time data-testid="updated" dateTime={card.updatedAt}>{new Date(card.updatedAt).toLocaleString()}</time>
      </p>
      <div className="actions detail-actions">
        <button ref={deleteButton} className="danger outline" onClick={() => setConfirming(true)}>
          Delete
        </button>
        <button className={card.wanted ? "outline" : "primary"} onClick={onEdit}>
          Edit
        </button>
        {card.wanted && (
          <button className="primary mark-owned" onClick={onMarkOwned}>
            Mark as owned
          </button>
        )}
      </div>
      {confirming && (
        <ConfirmDialog label="Delete card" onCancel={keep}>
          <p>Delete this card?</p>
          <div className="actions detail-actions">
            <button className="danger outline" onClick={onDelete}>
              Delete
            </button>
            <button className="primary" autoFocus onClick={keep}>
              Keep
            </button>
          </div>
        </ConfirmDialog>
      )}
    </section>
  );
}
