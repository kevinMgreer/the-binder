import { useEffect, type ReactNode } from "react";
import { openSheets } from "./Sheet";

interface Props {
  label: string;
  /** Backdrop tap, Escape and Android back. */
  onCancel: () => void;
  children: ReactNode;
}

/** A centred question over the screen; Android back is its cancel while it is open. */
export function ConfirmDialog({ label, onCancel, children }: Props) {
  useEffect(() => {
    openSheets.push(onCancel);
    return () => void openSheets.splice(openSheets.lastIndexOf(onCancel), 1);
  }, [onCancel]);

  return (
    <div className="backdrop center" onClick={onCancel} onKeyDown={(e) => e.key === "Escape" && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
