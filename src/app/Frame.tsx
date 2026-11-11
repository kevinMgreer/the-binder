import { useState } from "react";

/** A trading-card frame around a photo, turned to landscape once the photo turns out wider than tall; the placeholder without one. */
export function Frame({ url, alt = "" }: { url?: string; alt?: string }) {
  const [landscape, setLandscape] = useState(false);
  return (
    <span className="frame" data-orientation={landscape ? "landscape" : undefined}>
      {url ? (
        <img className="thumb" src={url} alt={alt} onLoad={(e) => setLandscape(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)} />
      ) : (
        <span className="thumb" aria-hidden="true" />
      )}
    </span>
  );
}
