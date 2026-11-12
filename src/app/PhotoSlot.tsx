import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, CardSide } from "../domain/card";
import { acquirePhoto } from "../photos/acquire";
import { PermissionDeniedError, type CapturedPhoto } from "../ports";
import { Frame } from "./Frame";
import { useBlobUrl, useThumbUrl } from "./hooks";
import { Icon } from "./Icon";
import { usePorts } from "./ports-context";
import { Sheet } from "./Sheet";

interface Props {
  side: CardSide;
  card?: Card;
  /** `null`: the stored photo was removed on this form. */
  captured?: CapturedPhoto | null;
  onChange: (photo: CapturedPhoto | null) => void;
  /** Lets the form hold Save while a photo is still being prepared. */
  onBusy?: (busy: boolean) => void;
}

export function PhotoSlot({ side, card, captured, onChange, onBusy }: Props) {
  const { photoSource } = usePorts();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const tileRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const closeChooser = useCallback(() => {
    restoreFocus.current = true;
    setChoosing(false);
  }, []);
  // The tile is disabled while busy, so focus waits until the photo is ready.
  useEffect(() => {
    if (restoreFocus.current && !choosing && !busy) {
      restoreFocus.current = false;
      tileRef.current?.focus();
    }
  });
  const label = side[0].toUpperCase() + side.slice(1);

  const stored = captured === null ? undefined : card?.photos[side];
  const storedUrl = useThumbUrl(card?.id ?? "", side, !!stored, card?.updatedAt ?? "");
  const capturedUrl = useBlobUrl(captured?.thumb);
  const url = capturedUrl ?? (captured === null ? undefined : storedUrl);
  const filled = !!(captured || stored);

  async function take(how: "camera" | "pick") {
    closeChooser();
    setMessage(undefined);
    setBusy(true);
    onBusy?.(true);
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
      onBusy?.(false);
    }
  }

  return (
    <div className="photo-cell">
      <button ref={tileRef} type="button" className="photo-tile" disabled={busy} aria-label={`${filled ? "Change" : "Add"} ${side} photo`} onClick={() => setChoosing(true)}>
        <Frame url={url} alt={`${label} photo`} />
        {!filled && (
          <span className="photo-tile-empty" aria-hidden="true">
            <Icon name="camera" />
            {label}
          </span>
        )}
      </button>
      {busy && <p role="status">Processing photo…</p>}
      {message && <p role="alert">{message}</p>}
      {choosing && (
        <Sheet compact label={`${label} photo`} onClose={closeChooser}>
          <button type="button" onClick={() => take("camera")}>
            {filled ? "Retake" : "Scan"} {side}
          </button>
          <button type="button" onClick={() => take("pick")}>
            Pick {side} from photos
          </button>
          {filled && (
            <button
              type="button"
              className="danger"
              onClick={() => {
                closeChooser();
                setMessage(undefined);
                onChange(null);
              }}
            >
              Remove {side} photo
            </button>
          )}
        </Sheet>
      )}
    </div>
  );
}
