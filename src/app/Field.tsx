import type { ReactNode } from "react";

export const fieldId = (label: string) => "f-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

interface Props {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, error, hint, required, children }: Props) {
  const id = fieldId(label);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {required && <span className="required">required</span>}
      {hint && (
        <span className="hint" data-testid={`hint-${id}`}>
          {hint}
        </span>
      )}
      {children}
      {error && (
        <span id={`${id}-error`} className="error">
          {error}
        </span>
      )}
    </div>
  );
}
