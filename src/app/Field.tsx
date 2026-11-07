import type { ReactNode } from "react";

export const fieldId = (label: string) => "f-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const id = fieldId(label);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span id={`${id}-error`} className="error">
          {error}
        </span>
      )}
    </div>
  );
}
