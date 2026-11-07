import { useEffect, useState } from "react";
import type { CardSide } from "../domain/card";
import { usePorts } from "./ports-context";

export function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return setUrl(undefined);
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  return url;
}

export function useThumbUrl(cardId: string, side: CardSide, enabled: boolean, version: string): string | undefined {
  const { photos } = usePorts();
  const [blob, setBlob] = useState<Blob>();
  useEffect(() => {
    let live = true;
    if (!enabled) setBlob(undefined);
    else void photos.getThumb(cardId, side).then((b) => live && setBlob(b));
    return () => {
      live = false;
    };
  }, [photos, cardId, side, enabled, version]);
  return useBlobUrl(blob);
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
