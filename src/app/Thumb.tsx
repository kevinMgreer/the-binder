import type { Card } from "../domain/card";
import { Frame } from "./Frame";
import { useThumbUrl } from "./hooks";

/** The whole front photo in its own orientation, framed, inside a fixed slot; the portrait placeholder without one. */
export function Thumb({ card }: { card: Card }) {
  const url = useThumbUrl(card.id, "front", !!card.photos.front, card.updatedAt);
  return (
    <span className="thumb-slot" aria-hidden="true">
      <Frame url={url}/>
    </span>
  );
}
