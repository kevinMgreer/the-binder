import { useEffect, type ReactNode } from "react";

// Open sheets, newest last. Android's back button closes the top one before it leaves a screen.
export const openSheets: Array<() => void> = [];

interface Props {
  label: string;
  onClose: () => void;
  full?: boolean;
  foot?: ReactNode;
  children: ReactNode;
}

export function Sheet({ label, onClose, full, foot, children }: Props) {
  useEffect(() => {
    openSheets.push(onClose);
    return () => void openSheets.splice(openSheets.lastIndexOf(onClose), 1);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} className={full ? "sheet full" : "sheet"}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className="sheet-head">
          <h2>{label}</h2>
          <button autoFocus onClick={onClose}>Close</button>
        </div>
        <div className="sheet-body">{children}</div>
        {foot && <div className="sheet-foot">{foot}</div>}
      </div>
    </div>
  );
}
