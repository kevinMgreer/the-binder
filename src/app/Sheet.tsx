import { useEffect, type ReactNode } from "react";

// Open sheets, newest last. Android's back button closes the top one before it leaves a screen.
export const openSheets: Array<() => void> = [];

interface Props {
  label: string;
  onClose: () => void;
  foot?: ReactNode;
  /** Sized to its content instead of full height. */
  compact?: boolean;
  /** Photo viewer: no visible title or head row, an icon-only X close over the content; the label stays as the dialog's name. */
  hideTitle?: boolean;
  children: ReactNode;
}

export function Sheet({ label, onClose, foot, compact, hideTitle, children }: Props) {
  useEffect(() => {
    openSheets.push(onClose);
    return () => void openSheets.splice(openSheets.lastIndexOf(onClose), 1);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} className={compact ? "sheet compact" : hideTitle ? "sheet viewer" : "sheet"}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className="sheet-head">
          <h2 className={hideTitle ? "visually-hidden" : undefined}>{label}</h2>
          {hideTitle ? (
            <button autoFocus className="icon-button viewer-close" aria-label="Close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          ) : (
            <button autoFocus onClick={onClose}>Close</button>
          )}
        </div>
        <div className="sheet-body">{children}</div>
        {foot && <div className="sheet-foot">{foot}</div>}
      </div>
    </div>
  );
}
