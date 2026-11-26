import { useEffect, useState } from "react";
import type { Card, CardSide } from "../domain/card";
import { photoFileName } from "../sync/names";
import { useBlobUrl, useOnline } from "./hooks";
import { Icon } from "./Icon";
import { usePorts } from "./ports-context";
import { ZoomableImage } from "./ZoomableImage";

export function PhotoView({ card, side, onSwipe }: { card: Card; side: CardSide; onSwipe?: (direction: "left" | "right") => void }) {
  const { photos, remote, gallery } = usePorts();
  const online = useOnline();
  const ref = card.photos[side];
  const [blobs, setBlobs] = useState<{ thumb?: Blob; full?: Blob }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const loadFull = async (fileId: string) => {
    const full = await remote.downloadPhoto(fileId);
    await photos.cacheFull(card.id, side, full);
    return full;
  };

  const save = async () => {
    setSaving(true);
    try {
      const full = blobs.full ?? (online && ref?.fileId ? await loadFull(ref.fileId) : undefined);
      if (!full) return setMessage("Connect to the internet to save the full photo");
      await gallery.save(full, photoFileName(card, side).replace(/\.webp$/, ""));
      setMessage("Saved to Photos");
    } catch {
      setMessage("Could not save the photo");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let live = true;
    void (async () => {
      if (!ref) return setBlobs({});
      const thumb = await photos.getThumb(card.id, side);
      let full = await photos.getFull(card.id, side);
      if (live) setBlobs({ thumb, full });
      if (!full && online && ref.fileId) {
        try {
          full = await loadFull(ref.fileId);
          if (live) setBlobs({ thumb, full });
        } catch {
          // Stay on the thumbnail; the next open retries.
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [photos, remote, card.id, side, ref?.fileId, card.updatedAt, online]);

  const url = useBlobUrl(blobs.full ?? blobs.thumb);
  if (!ref || !url) return null;

  const label = side[0].toUpperCase() + side.slice(1);
  return (
    <div className="photo-view">
      <ZoomableImage src={url} alt={`${label} photo`} testId={`zoom-${side}`} onSwipe={onSwipe} />
      {/* Placeholder icon until the download icon lands in Icon.tsx. */}
      <button className="icon-button viewer-close viewer-save" aria-label="Save to phone" disabled={saving} onClick={() => void save()}>
        <Icon name="check" />
      </button>
      {message && (
        <p role="status" className="viewer-toast">
          {message}
        </p>
      )}
      {!blobs.full && !online && <p>Full photo will load when online</p>}
    </div>
  );
}
