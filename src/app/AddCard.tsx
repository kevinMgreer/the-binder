import { useCallback, useState } from "react";
import { Sheet } from "./Sheet";

interface Props {
  onAdd: () => void;
  onScan: (mode: "camera" | "pick") => void;
}

/** The screen's one add button and the sheet it opens. */
export function AddCard({ onAdd, onScan }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button className="primary add-button" onClick={() => setOpen(true)}>
        Add card
      </button>
      {open && (
        <Sheet label="Add a card" onClose={close}>
          <button className="primary" onClick={() => onScan("camera")}>
            Scan card
          </button>
          <button onClick={() => onScan("pick")}>Pick from photos</button>
          <button onClick={onAdd}>Enter by hand</button>
        </Sheet>
      )}
    </>
  );
}
