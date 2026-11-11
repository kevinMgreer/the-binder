import { useState, type ReactNode } from "react";
import type { Card, CardSide } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";
import { Frame } from "./Frame";
import { useThumbUrl } from "./hooks";
import { PhotoView } from "./PhotoView";
import { Sheet } from "./Sheet";

interface Props {
  card: Card;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

const SIDES: CardSide[] = ["front", "back"];

function PhotoThumb({ card, side, onOpen }: { card: Card; side: CardSide; onOpen: () => void }) {
  const url = useThumbUrl(card.id, side, true, card.updatedAt);
  return (
    <button className="photo-thumb" aria-label={`View ${side} photo`} onClick={onOpen}>
      <Frame url={url} />
    </button>
  );
}

export function CardDetail({ card, onEdit, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [viewing, setViewing] = useState<CardSide | null>(null);
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
      <div className="title-row">
        <h2>{card.player}</h2>
        {serial && <span className="tag">{serial}</span>}
      </div>
      <div className="stitch" aria-hidden="true" />
      <p className="subtitle" data-testid="subtitle">
        {card.year} {card.set}
        {card.cardNumber && ` · #${card.cardNumber}`}
      </p>
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
      </div>
      <div className="danger-zone">
        <button className="danger" onClick={() => setConfirming(true)}>
          Delete
        </button>
      </div>
      {confirming && (
        <div role="alertdialog" aria-label="Delete card">
          <p>Delete this card?</p>
          <button className="danger" onClick={onDelete}>
            Confirm delete
          </button>
          <button onClick={() => setConfirming(false)}>Keep</button>
        </div>
      )}
    </section>
  );
}
