import { useState } from "react";
import type { Card } from "../domain/card";
import { gradeLabel, serialLabel } from "../domain/format";

interface Props {
  card: Card;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onBack: () => void;
}

export function CardDetail({ card, onEdit, onDelete, onBack }: Props) {
  const [confirming, setConfirming] = useState(false);
  const serial = serialLabel(card.parallel);
  const flags = [card.flags.rookie && "Rookie", card.flags.autograph && "Autograph", card.flags.relic && "Relic"].filter(Boolean);

  return (
    <section>
      <button onClick={onBack}>Back</button>
      <h2>{card.player}</h2>
      <p>
        {card.year} {card.manufacturer} {card.set} #{card.cardNumber}
      </p>
      {card.team && <p>{card.team}</p>}
      {card.parallel && (
        <p>
          {card.parallel.name} {serial}
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
        <button onClick={onEdit}>Edit</button>
        <button onClick={() => setConfirming(true)}>Delete</button>
      </div>
      {confirming && (
        <div role="alertdialog" aria-label="Delete card">
          <p>Delete this card?</p>
          <button onClick={onDelete}>Confirm delete</button>
          <button onClick={() => setConfirming(false)}>Keep</button>
        </div>
      )}
    </section>
  );
}
