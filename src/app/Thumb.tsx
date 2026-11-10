import type { Card } from "../domain/card";
import { useThumbUrl } from "./hooks";

/** The whole front photo in its own orientation inside a square slot; the portrait placeholder without one. */
export function Thumb({ card }: { card: Card }) {
  const url = useThumbUrl(card.id, "front", !!card.photos.front, card.updatedAt);
  return (
    <span className="thumb-slot" aria-hidden="true">
      {url ? <img className="thumb" src={url} alt="" /> : <span className="thumb" />}
    </span>
  );
}
