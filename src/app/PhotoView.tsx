import { useEffect, useState } from "react";
import type { Card, CardSide } from "../domain/card";
import { useBlobUrl, useOnline } from "./hooks";
import { usePorts } from "./ports-context";
import { ZoomableImage } from "./ZoomableImage";

export function PhotoView({ card, side }: { card: Card; side: CardSide }) {
  const { photos, remote } = usePorts();
  const online = useOnline();
  const ref = card.photos[side];
  const [blobs, setBlobs] = useState<{ thumb?: Blob; full?: Blob }>({});

  useEffect(() => {
    let live = true;
    void (async () => {
      if (!ref) return setBlobs({});
      const thumb = await photos.getThumb(card.id, side);
      let full = await photos.getFull(card.id, side);
      if (live) setBlobs({ thumb, full });
      if (!full && online && ref.fileId) {
        try {
          full = await remote.downloadPhoto(ref.fileId);
          await photos.cacheFull(card.id, side, full);
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
    <div>
      <ZoomableImage src={url} alt={`${label} photo`} testId={`zoom-${side}`} />
      {!blobs.full && !online && <p>Full photo will load when online</p>}
    </div>
  );
}
