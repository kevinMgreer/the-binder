import { useEffect, useRef, useState } from "react";
import type { CardSide } from "../domain/card";
import { acquirePhoto } from "../photos/acquire";
import { PermissionDeniedError, type Photos } from "../ports";
import { usePorts } from "./ports-context";

type Phase = "working" | "back" | "denied" | "error";

interface Props {
  mode: "camera" | "pick";
  onDone: (photos: Photos) => void;
  onCancel: () => void;
}

export function ScanFlow({ mode, onDone, onCancel }: Props) {
  const { photoSource } = usePorts();
  const [phase, setPhase] = useState<Phase>("working");
  const [pendingSide, setPendingSide] = useState<CardSide>("front");
  const photos = useRef<Photos>({});
  const started = useRef(false);

  async function take(side: CardSide, how: "camera" | "pick") {
    setPendingSide(side);
    setPhase("working");
    try {
      const photo = await acquirePhoto(photoSource, side, how);
      if (!photo) return side === "front" ? onCancel() : setPhase("back");
      photos.current = { ...photos.current, [side]: photo };
      if (side === "front" && how === "camera") setPhase("back");
      else onDone(photos.current);
    } catch (error) {
      setPhase(error instanceof PermissionDeniedError ? "denied" : "error");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void take("front", mode);
  }, []);

  if (phase === "back") {
    return (
      <section>
        <h2>Back of card</h2>
        <div className="actions">
          <button onClick={() => take("back", "camera")}>Capture back</button>
          <button onClick={() => onDone(photos.current)}>Skip back</button>
        </div>
      </section>
    );
  }

  if (phase === "denied") {
    return (
      <section>
        <p role="alert">Camera permission denied. You can pick images from your photos instead.</p>
        <div className="actions">
          <button onClick={() => take(pendingSide, "pick")}>Pick from photos</button>
          <button onClick={() => (pendingSide === "back" ? onDone(photos.current) : onCancel())}>Cancel</button>
        </div>
      </section>
    );
  }

  if (phase === "error") {
    return (
      <section>
        <p role="alert">Could not load that photo.</p>
        <button onClick={onCancel}>Cancel</button>
      </section>
    );
  }

  return <p>Processing photo…</p>;
}
