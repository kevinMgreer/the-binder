import { useState } from "react";
import type { Card, CardSide } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";
import { useThumbUrl } from "./hooks";
import { PhotoView } from "./PhotoView";
import { Sheet } from "./Sheet";

interface Props {
  card: Card;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onBack: () => void;
}

const SIDES: CardSide[] = ["front", "back"];

function PhotoThumb({ card, side, onOpen }: { card: Card; side: CardSide; onOpen: () => void }) {
  const url = useThumbUrl(card.id, side, true, card.updatedAt);
  return (
    <button className="photo-thumb" aria-label={`View ${side} photo`} onClick={onOpen}>
      {url && <img src={url} alt="" />}
    </button>
  );
}

export function CardDetail({ card, onEdit, onDelete, onBack }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [viewing, setViewing] = useState<CardSide | null>(null);
  const serial = serialLabel(card.parallel);
  const flags = [card.flags.rookie && "Rookie", card.flags.autograph && "Autograph", card.flags.relic && "Relic"].filter(Boolean);

  return (
    <section>
      <button onClick={onBack}>Back</button>
      <div className="photo-row">
        {SIDES.map((side) => card.photos[side] && <PhotoThumb key={side} card={card} side={side} onOpen={() => setViewing(side)} />)}
      </div>
      {viewing && (
        <Sheet label={`${viewing === "front" ? "Front" : "Back"} photo view`} full onClose={() => setViewing(null)}>
          <PhotoView card={card} side={viewing} />
        </Sheet>
      )}
      <h2>{card.player}</h2>
      <p>
        {card.year} {card.manufacturer} {card.set} #{card.cardNumber}
      </p>
      {card.team && <p>{card.team}</p>}
      {card.parallel && (
        <p>
          {card.parallel.name} {serial && <span className="tag">{serial}</span>}
        </p>
      )}
      {gradeLabel(card.grading) && <p>{gradeLabel(card.grading)}</p>}
      {flags.length > 0 && <p>{flags.join(", ")}</p>}
      <p>Quantity: {card.quantity}</p>
      {card.notes && <p>{card.notes}</p>}
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
