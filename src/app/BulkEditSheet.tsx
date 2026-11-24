import { useCallback, useState } from "react";
import { CONDITIONS, type Grading } from "../domain/card";
import type { BulkPatch } from "../usecases/cards";
import { Field, fieldId } from "./Field";
import { ConfirmDialog } from "./ConfirmDialog";
import { Sheet } from "./Sheet";

export interface BulkOptions {
  team: string[];
  manufacturer: string[];
  set: string[];
  subset: string[];
  insert: string[];
  parallel: string[];
}

interface Props {
  count: number;
  options: BulkOptions;
  onSave: (patch: BulkPatch) => Promise<void>;
  onClose: () => void;
}

type Tri = "" | "yes" | "no";
const empty = { team: "", year: "", manufacturer: "", set: "", subset: "", insert: "", parallel: "", rookie: "" as Tri, autograph: "" as Tri, relic: "" as Tri, grading: "", condition: "", company: "", grade: "" };
type Draft = typeof empty;

const ORDER = [
  ["team", "Team"],
  ["year", "Year"],
  ["manufacturer", "Manufacturer"],
  ["set", "Set"],
  ["subset", "Subset"],
  ["insert", "Insert"],
  ["parallel", "Parallel name"],
  ["rookie", "Rookie"],
  ["autograph", "Autograph"],
  ["relic", "Relic"],
  ["grading", "Grading"],
] as const;
const FLAGS = ["rookie", "autograph", "relic"] as const;

function toGrading(d: Draft): Grading | undefined {
  if (d.grading === "raw") return { kind: "raw", condition: d.condition };
  if (d.grading === "graded" && d.company.trim() && d.grade.trim()) return { kind: "graded", company: d.company.trim(), grade: d.grade.trim() };
}

/** Only fields the user changed: a blank text field or a "Keep as is" choice has no key. */
export function toPatch(d: Draft): BulkPatch {
  const patch: BulkPatch = {};
  for (const key of ["team", "manufacturer", "set", "subset", "insert"] as const) if (d[key].trim()) patch[key] = d[key].trim();
  if (d.parallel.trim()) patch.parallelName = d.parallel.trim();
  const year = Number(d.year);
  if (d.year.trim() && Number.isInteger(year) && year >= 1800) patch.year = year;
  for (const key of FLAGS) if (d[key]) patch[key] = d[key] === "yes";
  const grading = toGrading(d);
  if (grading) patch.grading = grading;
  return patch;
}

export function BulkEditSheet({ count, options, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(empty);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof Draft, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const [error, setError] = useState("");
  const patch = toPatch(draft);
  const gradedIncomplete = draft.grading === "graded" && !toGrading(draft);
  const yearInvalid = draft.year.trim() !== "" && !("year" in patch);
  const noun = `${count} ${count === 1 ? "card" : "cards"}`;

  const cancelConfirm = useCallback(() => setConfirming(false), []);

  const choice = (key: "rookie" | "autograph" | "relic" | "grading", label: string, choices: Array<[string, string]>) => (
    <Field key={key} label={label}>
      <select id={fieldId(label)} autoFocus value={draft[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">Keep as is</option>
        {choices.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </Field>
  );

  return (
    <>
      <Sheet
        label={`Edit ${noun}`}
        onClose={onClose}
        foot={
          <button className="primary" disabled={Object.keys(patch).length === 0 || gradedIncomplete || yearInvalid} onClick={() => setConfirming(true)}>
            Change {noun}
          </button>
        }
      >
        <p className="hint">Choose what to change. Everything else stays as it is.</p>
        {ORDER.map(([key, label]) => {
          if (!open.has(key)) {
            return (
              <button key={key} className="field-add" onClick={() => setOpen((o) => new Set(o).add(key))}>
                {label}
                <span>Keep as is</span>
              </button>
            );
          }
          if (key === "year") {
            return (
              <Field key={key} label="Year">
                <input id={fieldId("Year")} type="number" autoFocus value={draft.year} aria-describedby={yearInvalid ? "bulk-year-hint" : undefined} onChange={(e) => set("year", e.target.value)} />
                {yearInvalid && <p id="bulk-year-hint" role="status">Enter a year</p>}
              </Field>
            );
          }
          if (key === "grading") return choice("grading", label, [["raw", "Raw"], ["graded", "Graded"]]);
          if (key === "rookie" || key === "autograph" || key === "relic") return choice(key, label, [["yes", "Yes"], ["no", "No"]]);
          return (
            <Field key={key} label={label}>
              <input id={fieldId(label)} list={`bulk-${key}`} autoFocus value={draft[key]} onChange={(e) => set(key, e.target.value)} />
              <datalist id={`bulk-${key}`}>
                {options[key].map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </Field>
          );
        })}
        {draft.grading === "raw" && (
          <Field label="Condition">
            <select id={fieldId("Condition")} value={draft.condition} onChange={(e) => set("condition", e.target.value)}>
              <option value="">Not listed</option>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        )}
        {draft.grading === "graded" && (
          <div className="pair">
            <Field label="Grading company">
              <input id={fieldId("Grading company")} value={draft.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="Grade">
              <input id={fieldId("Grade")} value={draft.grade} onChange={(e) => set("grade", e.target.value)} />
            </Field>
          </div>
        )}
      </Sheet>
      {confirming && (
        <ConfirmDialog label={`Change ${noun}?`} onCancel={cancelConfirm}>
          <p>Change {noun}?</p>
          {error && <p role="status">{error}</p>}
          <div className="actions detail-actions">
            <button
              className="primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setError("");
                try {
                  await onSave(patch);
                } catch {
                  setSaving(false);
                  setError("Could not save the change. Try again.");
                }
              }}
            >
              Change
            </button>
            <button autoFocus onClick={cancelConfirm}>Cancel</button>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
