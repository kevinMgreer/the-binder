import { useEffect, type ReactNode } from "react";

// Open sheets, newest last. Android's back button closes the top one before it leaves a screen.
export const openSheets: Array<() => void> = [];

interface Props {
  label: string;
  onClose: () => void;
  foot?: ReactNode;
  /** Sized to its content instead of full height. */
  compact?: boolean;
  /** Replaces the visible title in the head; the label stays as the dialog's hidden name. */
  headStart?: ReactNode;
  children: ReactNode;
}

export function Sheet({ label, onClose, foot, compact, headStart, children }: Props) {
  useEffect(() => {
    openSheets.push(onClose);
    return () => void openSheets.splice(openSheets.lastIndexOf(onClose), 1);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} className={compact ? "sheet compact" : "sheet"}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className="sheet-head">
          <h2 className={headStart ? "visually-hidden" : undefined}>{label}</h2>
          {headStart}
          <button autoFocus onClick={onClose}>Close</button>
        </div>
        <div className="sheet-body">{children}</div>
        {foot && <div className="sheet-foot">{foot}</div>}
      </div>
    </div>
  );
}
