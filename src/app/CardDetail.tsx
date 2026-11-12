import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Card, CardSide } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";
import { Frame } from "./Frame";
import { useThumbUrl } from "./hooks";
import { PhotoView } from "./PhotoView";
import { Sheet, openSheets } from "./Sheet";

interface Props {
  card: Card;
  onEdit: () => void;
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

export function CardDetail({ card, onEdit, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [viewing, setViewing] = useState<CardSide | null>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const keep = () => {
    setConfirming(false);
    deleteButton.current?.focus();
  };
  // Android back is Keep while the dialog is open, like the form's discard prompt.
  useEffect(() => {
    if (!confirming) return;
    openSheets.push(keep);
    return () => void openSheets.splice(openSheets.lastIndexOf(keep), 1);
  }, [confirming]);
  const serial = serialLabel(card.parallel);
  const flags = [card.flags.rookie && "Rookie", card.flags.autograph && "Autograph", card.flags.relic && "Relic"].filter(Boolean);
  const teamLine = [card.team, card.parallel?.name].filter(Boolean).join(" · ");
  const facts: Array<[string, ReactNode]> = [
    ["Manufacturer", card.manufacturer],
    ["Subset", card.subset],
    ["Insert", card.insert],
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
        </div>
        <p className="subtitle" data-testid="subtitle">
          {card.year} {card.set}
          {card.cardNumber && ` · #${card.cardNumber}`}
        </p>
        {teamLine && (
          <p className="subtitle" data-testid="team-line">
            {teamLine}
          </p>
        )}
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
        <Sheet label={`${viewing === "front" ? "Front" : "Back"} photo view`} onClose={() => setViewing(null)}>
          <PhotoView card={card} side={viewing} />
        </Sheet>
      )}
      <p>
        Last edited <time data-testid="updated" dateTime={card.updatedAt}>{new Date(card.updatedAt).toLocaleString()}</time>
      </p>
      <div className="actions">
        <button className="primary" onClick={onEdit}>
          Edit
        </button>
        <button ref={deleteButton} className="danger" onClick={() => setConfirming(true)}>
          Delete
        </button>
      </div>
      {confirming && (
        <div
          className="backdrop center"
          onClick={keep}
          onKeyDown={(e) => e.key === "Escape" && keep()}
        >
          <div role="alertdialog" aria-modal="true" aria-label="Delete card" onClick={(e) => e.stopPropagation()}>
            <p>Delete this card?</p>
            <div className="actions">
              <button autoFocus onClick={keep}>
                Keep
              </button>
              <button className="danger" onClick={onDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
