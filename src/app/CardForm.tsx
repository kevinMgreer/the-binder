import { useState } from "react";
import type { Card } from "../domain/card";
import { findDuplicate } from "../domain/query";
import { validateCard, type FieldErrors, type FieldKey } from "../domain/schema";
import type { Photos } from "../ports";
import { Field, fieldId } from "./Field";
import { PhotoSlot } from "./PhotoSlot";

interface Draft {
  player: string;
  team: string;
  year: string;
  manufacturer: string;
  set: string;
  cardNumber: string;
  parallel: string;
  serial: string;
  serialUnreadable: boolean;
  printRun: string;
  rookie: boolean;
  autograph: boolean;
  relic: boolean;
  graded: boolean;
  company: string;
  grade: string;
  condition: string;
  quantity: string;
  notes: string;
}

function toDraft(c?: Card): Draft {
  return {
    player: c?.player ?? "",
    team: c?.team ?? "",
    year: c ? String(c.year) : "",
    manufacturer: c?.manufacturer ?? "",
    set: c?.set ?? "",
    cardNumber: c?.cardNumber ?? "",
    parallel: c?.parallel?.name ?? "",
    serial: c?.parallel?.serial?.toString() ?? "",
    serialUnreadable: c?.parallel ? !c.parallel.serialLegible : false,
    printRun: c?.parallel?.printRun?.toString() ?? "",
    rookie: c?.flags.rookie ?? false,
    autograph: c?.flags.autograph ?? false,
    relic: c?.flags.relic ?? false,
    graded: c?.grading.kind === "graded",
    company: c?.grading.kind === "graded" ? c.grading.company : "",
    grade: c?.grading.kind === "graded" ? c.grading.grade : "",
    condition: c?.grading.kind === "raw" ? c.grading.condition : "",
    quantity: String(c?.quantity ?? 1),
    notes: c?.notes ?? "",
  };
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));

function toCard(d: Draft, existing: Card | undefined): Card {
  const now = new Date().toISOString();
  const hasParallel = d.parallel.trim() !== "" || d.serial !== "" || d.printRun !== "" || d.serialUnreadable;
  return {
    id: existing?.id ?? crypto.randomUUID(),
    player: d.player.trim(),
    team: d.team.trim(),
    year: d.year.trim() === "" ? Number.NaN : Number(d.year),
    manufacturer: d.manufacturer.trim(),
    set: d.set.trim(),
    cardNumber: d.cardNumber.trim(),
    parallel: hasParallel
      ? {
          name: d.parallel.trim(),
          serial: d.serialUnreadable ? null : num(d.serial),
          serialLegible: !d.serialUnreadable,
          printRun: num(d.printRun),
        }
      : null,
    flags: { rookie: d.rookie, autograph: d.autograph, relic: d.relic },
    grading: d.graded
      ? { kind: "graded", company: d.company.trim(), grade: d.grade.trim() }
      : { kind: "raw", condition: d.condition.trim() },
    quantity: Number(d.quantity),
    notes: d.notes,
    photos: existing?.photos ?? { front: null, back: null },
    source: existing?.source ?? "manual",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  };
}

interface Props {
  card?: Card;
  cards: Card[];
  initialPhotos?: Photos;
  onSave: (card: Card, photos?: Photos) => Promise<void>;
  onCancel: () => void;
}

export function CardForm({ card, cards, initialPhotos, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(() => toDraft(card));
  const [photos, setPhotos] = useState<Photos>(initialPhotos ?? {});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [duplicate, setDuplicate] = useState<{ existing: Card; added: Card }>();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const text = (key: keyof Draft & string, label: string, error?: FieldKey, type = "text") => {
    const message = error && errors[error];
    return (
      <Field label={label} error={message}>
        <input
          id={fieldId(label)}
          type={type}
          value={draft[key] as string}
          onChange={(e) => set(key, e.target.value)}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${fieldId(label)}-error` : undefined}
          disabled={key === "serial" && draft.serialUnreadable}
        />
      </Field>
    );
  };

  const check = (key: keyof Draft & string, label: string) => (
    <label className="check">
      <input type="checkbox" checked={draft[key] as boolean} onChange={(e) => set(key, e.target.checked)} />
      {label}
    </label>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = toCard(draft, card);
    const found = validateCard(next);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const existing = card ? undefined : findDuplicate(cards, next);
    if (existing) setDuplicate({ existing, added: next });
    else await onSave(next, photos);
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2>{card ? "Edit card" : "Add card"}</h2>
      <PhotoSlot side="front" card={card} captured={photos.front} onChange={(p) => setPhotos((s) => ({ ...s, front: p }))} />
      <PhotoSlot side="back" card={card} captured={photos.back} onChange={(p) => setPhotos((s) => ({ ...s, back: p }))} />
      {text("player", "Player", "player")}
      {text("team", "Team")}
      {text("year", "Year", "year", "number")}
      {text("manufacturer", "Manufacturer")}
      {text("set", "Set", "set")}
      {text("cardNumber", "Card number", "cardNumber")}
      {text("parallel", "Parallel")}
      {text("serial", "Serial", "serial", "number")}
      {check("serialUnreadable", "Serial unreadable")}
      {text("printRun", "Print run", "printRun", "number")}
      {check("rookie", "Rookie")}
      {check("autograph", "Autograph")}
      {check("relic", "Relic")}
      {check("graded", "Graded")}
      {draft.graded ? (
        <>
          {text("company", "Grading company", "grading")}
          {text("grade", "Grade", "grading")}
        </>
      ) : (
        text("condition", "Condition")
      )}
      {text("quantity", "Quantity", "quantity", "number")}
      <Field label="Notes">
        <textarea id={fieldId("Notes")} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      {errors.card && <p role="alert">{errors.card}</p>}
      <div className="actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {duplicate && (
        <div role="dialog" aria-modal="true" aria-label="Duplicate card">
          <p>This card is already in your collection ({duplicate.existing.quantity} owned).</p>
          <button
            type="button"
            onClick={() =>
              onSave({
                ...duplicate.existing,
                quantity: duplicate.existing.quantity + duplicate.added.quantity,
                updatedAt: new Date().toISOString(),
              })
            }
          >
            Increase quantity
          </button>
          <button type="button" onClick={() => onSave(duplicate.added, photos)}>
            Add as separate card
          </button>
          <button type="button" onClick={() => setDuplicate(undefined)}>
            Back to form
          </button>
        </div>
      )}
    </form>
  );
}
