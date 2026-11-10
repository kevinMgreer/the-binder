import { useState } from "react";
import type { Card, CardSide } from "../domain/card";
import { acquirePhoto } from "../photos/acquire";
import { PermissionDeniedError, type CapturedPhoto } from "../ports";
import { useBlobUrl, useThumbUrl } from "./hooks";
import { usePorts } from "./ports-context";

interface Props {
  side: CardSide;
  card?: Card;
  captured?: CapturedPhoto;
  onChange: (photo: CapturedPhoto) => void;
}

export function PhotoSlot({ side, card, captured, onChange }: Props) {
  const { photoSource } = usePorts();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const label = side[0].toUpperCase() + side.slice(1);

  const storedUrl = useThumbUrl(card?.id ?? "", side, !!card?.photos[side], card?.updatedAt ?? "");
  const capturedUrl = useBlobUrl(captured?.thumb);
  const url = capturedUrl ?? storedUrl;

  async function take(how: "camera" | "pick") {
    setMessage(undefined);
    setBusy(true);
    try {
      const photo = await acquirePhoto(photoSource, side, how);
      if (photo) onChange(photo);
    } catch (error) {
      setMessage(
        error instanceof PermissionDeniedError
          ? "Camera permission denied. Pick from photos instead."
          : "Could not load that photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="photo-slot">
      {url ? <img src={url} alt={`${label} photo`} /> : <span className="thumb" aria-hidden="true" />}
      <div className="actions">
        <button type="button" disabled={busy} onClick={() => take("camera")}>
          {captured || card?.photos[side] ? "Retake" : "Scan"} {side}
        </button>
        <button type="button" disabled={busy} onClick={() => take("pick")}>
          Pick {side} from photos
        </button>
      </div>
      {busy && <p role="status">Processing photo…</p>}
      {message && <p role="alert">{message}</p>}
    </div>
  );
}
