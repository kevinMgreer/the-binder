import { useState } from "react";

// Orientation learned per photo, so a row the list scrolls away and back (a new object url each time) does not flip.
const landscapeByKey = new Map<string, boolean>();

/** A trading-card frame around a photo, turned to landscape once the photo turns out wider than tall; the placeholder without one. */
export function Frame({ url, alt = "", cacheKey }: { url?: string; alt?: string; cacheKey?: string }) {
  const key = cacheKey ?? url;
  const [landscape, setLandscape] = useState(() => (key ? landscapeByKey.get(key) ?? false : false));
  return (
    <span className="frame" data-orientation={landscape ? "landscape" : undefined}>
      {url ? (
        <img
          className="thumb"
          src={url}
          alt={alt}
          onLoad={(e) => {
            const wide = e.currentTarget.naturalWidth > e.currentTarget.naturalHeight;
            if (key) landscapeByKey.set(key, wide);
            setLandscape(wide);
          }}
        />
      ) : (
        <span className="thumb" aria-hidden="true" />
      )}
    </span>
  );
}
