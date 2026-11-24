import { useEffect, useState } from "react";
import { CONDITIONS, type Grading } from "../domain/card";
import type { BulkPatch } from "../usecases/cards";
import { Field, fieldId } from "./Field";
import { Sheet, openSheets } from "./Sheet";

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

const TEXT = [
  ["team", "Team", "team"],
  ["manufacturer", "Manufacturer", "manufacturer"],
  ["set", "Set", "set"],
  ["subset", "Subset", "subset"],
  ["insert", "Insert", "insert"],
  ["parallel", "Parallel name", "parallel"],
] as const;
const FLAGS = [["rookie", "Rookie"], ["autograph", "Autograph"], ["relic", "Relic"]] as const;

function toGrading(d: Draft): Grading | undefined {
  if (d.grading === "raw") return { kind: "raw", condition: d.condition };
  if (d.grading === "graded" && d.company.trim() && d.grade.trim()) return { kind: "graded", company: d.company.trim(), grade: d.grade.trim() };
}

/** Only fields the user changed: a blank text field or a "Keep as is" choice has no key. */
export function toPatch(d: Draft): BulkPatch {
  const patch: BulkPatch = {};
  for (const key of ["team", "manufacturer", "set", "subset", "insert"] as const) if (d[key].trim()) patch[key] = d[key].trim();
  if (d.parallel.trim()) patch.parallelName = d.parallel.trim();
  if (d.year.trim() && Number.isFinite(Number(d.year))) patch.year = Number(d.year);
  for (const [key] of FLAGS) if (d[key]) patch[key] = d[key] === "yes";
  const grading = toGrading(d);
  if (grading) patch.grading = grading;
  return patch;
}

export function BulkEditSheet({ count, options, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(empty);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof Draft, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const patch = toPatch(draft);
  const noun = `${count} ${count === 1 ? "card" : "cards"}`;

  // Android back is Cancel while the dialog is open.
  useEffect(() => {
    if (!confirming) return;
    const cancel = () => setConfirming(false);
    openSheets.push(cancel);
    return () => void openSheets.splice(openSheets.lastIndexOf(cancel), 1);
  }, [confirming]);

  const choice = (key: "rookie" | "autograph" | "relic" | "grading", label: string, choices: Array<[string, string]>) => (
    <Field key={key} label={label}>
      <select id={fieldId(label)} value={draft[key]} onChange={(e) => set(key, e.target.value)}>
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
          <button className="primary" disabled={Object.keys(patch).length === 0} onClick={() => setConfirming(true)}>
            Change {noun}
          </button>
        }
      >
        {TEXT.map(([key, label, list]) => (
          <Field key={key} label={label}>
            <input id={fieldId(label)} list={`bulk-${list}`} placeholder="Keep as is" value={draft[key]} onChange={(e) => set(key, e.target.value)} />
            <datalist id={`bulk-${list}`}>
              {options[list].map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </Field>
        ))}
        <Field label="Year">
          <input id={fieldId("Year")} type="number" placeholder="Keep as is" value={draft.year} onChange={(e) => set("year", e.target.value)} />
        </Field>
        {FLAGS.map(([key, label]) => choice(key, label, [["yes", "Yes"], ["no", "No"]]))}
        {choice("grading", "Grading", [["raw", "Raw"], ["graded", "Graded"]])}
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
        <div className="backdrop center" onClick={() => setConfirming(false)} onKeyDown={(e) => e.key === "Escape" && setConfirming(false)}>
          <div role="alertdialog" aria-modal="true" aria-label={`Change ${noun}?`} onClick={(e) => e.stopPropagation()}>
            <p>Change {noun}?</p>
            <div className="actions detail-actions">
              <button
                className="primary"
                disabled={saving}
                onClick={() => {
                  setSaving(true);
                  void onSave(patch);
                }}
              >
                Change
              </button>
              <button autoFocus onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
