import { useEffect, useRef, useState } from "react";
import { CONDITIONS, type Card, type CardSide, type Suggestion } from "../domain/card";
import { isSerialNumbered } from "../domain/format";
import { findDuplicate } from "../domain/query";
import { REQUIRED_FIELDS, validateCard, type FieldErrors, type FieldKey } from "../domain/schema";
import { AuthExpiredError, DailyLimitError, type CapturedPhoto, type Photos } from "../ports";
import { Field, fieldId } from "./Field";
import { PhotoSlot } from "./PhotoSlot";
import { usePorts } from "./ports-context";
import { flaggedKeys, suggestionPatch, type DraftKey } from "./suggestions";

interface Draft {
  player: string;
  team: string;
  year: string;
  manufacturer: string;
  set: string;
  subset: string;
  insert: string;
  cardNumber: string;
  parallel: string;
  serialNumbered: boolean;
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

/** The list entry a stored condition equals ignoring case, else the stored value. */
const listedCondition = (stored: string) =>
  CONDITIONS.find((o) => o.toLowerCase() === stored.trim().toLowerCase()) ?? stored;

function toDraft(c?: Card): Draft {
  return {
    player: c?.player ?? "",
    team: c?.team ?? "",
    year: c ? String(c.year) : "",
    manufacturer: c?.manufacturer ?? "",
    set: c?.set ?? "",
    subset: c?.subset ?? "",
    insert: c?.insert ?? "",
    cardNumber: c?.cardNumber ?? "",
    parallel: c?.parallel?.name ?? "",
    serialNumbered: c ? isSerialNumbered(c) : false,
    serial: c?.parallel?.serial?.toString() ?? "",
    serialUnreadable: c?.parallel ? !c.parallel.serialLegible : false,
    printRun: c?.parallel?.printRun?.toString() ?? "",
    rookie: c?.flags.rookie ?? false,
    autograph: c?.flags.autograph ?? false,
    relic: c?.flags.relic ?? false,
    graded: c?.grading.kind === "graded",
    company: c?.grading.kind === "graded" ? c.grading.company : "",
    grade: c?.grading.kind === "graded" ? c.grading.grade : "",
    condition: c?.grading.kind === "raw" ? listedCondition(c.grading.condition) : "",
    quantity: String(c?.quantity ?? 1),
    notes: c?.notes ?? "",
  };
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));

function toCard(d: Draft, existing: Card | undefined, source: Card["source"]): Card {
  const now = new Date().toISOString();
  const hasParallel = d.parallel.trim() !== "" || d.serialNumbered || d.printRun !== "";
  // An unchecked box drops a serial typed earlier.
  const unreadable = d.serialNumbered && d.serialUnreadable;
  return {
    ...existing,
    id: existing?.id ?? crypto.randomUUID(),
    player: d.player.trim(),
    team: d.team.trim(),
    year: d.year.trim() === "" ? Number.NaN : Number(d.year),
    manufacturer: d.manufacturer.trim(),
    set: d.set.trim(),
    subset: d.subset.trim(),
    insert: d.insert.trim(),
    cardNumber: d.cardNumber.trim(),
    parallel: hasParallel
      ? {
          name: d.parallel.trim(),
          serialNumbered: d.serialNumbered,
          serial: d.serialNumbered && !unreadable ? num(d.serial) : null,
          serialLegible: !unreadable,
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
    source,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  };
}

interface Props {
  card?: Card;
  cards: Card[];
  onSave: (card: Card, photos?: Photos) => Promise<void>;
  onCancel: () => void;
}

// Top-to-bottom order of the form, so "first problem" is the one nearest the top.
const FORM_ORDER: FieldKey[] = ["player", "year", "set", "cardNumber", "serial", "printRun", "grading", "quantity"];

function labelFor(key: FieldKey, draft: Draft): string {
  if (key === "cardNumber") return "Card number";
  if (key === "printRun") return "Print run";
  if (key === "grading") return draft.company.trim() === "" ? "Grading company" : "Grade";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function CardForm({ card, cards, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(() => toDraft(card));
  const [photos, setPhotos] = useState<Photos>({});
  const [preparing, setPreparing] = useState({ front: false, back: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [duplicate, setDuplicate] = useState<{ existing: Card; added: Card }>();

  const { ocr, claude, photos: photoStore } = usePorts();
  const [suggested, setSuggested] = useState<Partial<Record<DraftKey, "ocr" | "claude">>>({});
  const [flagged, setFlagged] = useState<Set<DraftKey>>(new Set());
  const [origin, setOrigin] = useState<"ocr" | "claude" | null>(null);
  const [note, setNote] = useState<string>();
  const [identifying, setIdentifying] = useState(false);
  const touched = useRef(new Set<DraftKey>());
  const latest = useRef({ draft, suggested });
  latest.current = { draft, suggested };
  const recognized = useRef(new WeakSet<CapturedPhoto>());

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // The user's own edit always wins: it clears the suggestion marker and blocks later suggestions for that field.
  const edit = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    touched.current.add(key as DraftKey);
    setSuggested((s) => ({ ...s, [key]: undefined }));
    setFlagged((f) => new Set([...f].filter((k) => k !== key)));
    set(key, value);
  };

  /** Fills fields the user has not touched that are empty or hold an earlier suggestion. Returns whether anything changed. */
  function applySuggestion(suggestion: Suggestion, source: "ocr" | "claude"): boolean {
    const { draft: current, suggested: marked } = latest.current;
    const patch: Partial<Record<DraftKey, string | boolean>> = {};
    for (const [key, value] of Object.entries(suggestionPatch(suggestion)) as [DraftKey, string | boolean][]) {
      const empty = current[key] === "" || current[key] === false;
      if (!touched.current.has(key) && (empty || marked[key])) patch[key] = value;
    }
    const keys = Object.keys(patch) as DraftKey[];
    if (keys.length === 0) return false;
    setDraft((d) => ({ ...d, ...patch }) as Draft);
    setSuggested((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, source])) }));
    const doubtful = new Set(flaggedKeys(suggestion));
    setFlagged((f) => new Set([...[...f].filter((k) => !keys.includes(k)), ...keys.filter((k) => doubtful.has(k))]));
    setOrigin((o) => (source === "claude" || o === "claude" ? "claude" : "ocr"));
    setNote(undefined);
    return true;
  }

  useEffect(() => {
    const fresh = (["front", "back"] as CardSide[]).filter((side) => photos[side] && !recognized.current.has(photos[side]!));
    if (fresh.length === 0) return;
    for (const side of fresh) recognized.current.add(photos[side]!);
    const input = Object.fromEntries(fresh.map((side) => [side, photos[side]!.full]));
    void ocr
      .recognize(input)
      .then((suggestion) => applySuggestion(suggestion, "ocr"))
      .catch(() => false)
      .then((any) => {
        if (!any) setNote("Nothing recognized on this device. Try Identify with Claude, or enter the details yourself.");
      });
  }, [photos]);

  async function identify() {
    if (!navigator.onLine) return setNote("Identify with Claude needs an internet connection.");
    setIdentifying(true);
    setNote(undefined);
    try {
      const front = photos.front?.full ?? (card?.photos.front ? await photoStore.getFull(card.id, "front") : undefined);
      const back = photos.back?.full ?? (card?.photos.back ? await photoStore.getFull(card.id, "back") : undefined);
      if (!front && !back) return setNote("The full photo is not on this device yet. Open the card while online first.");
      if (!applySuggestion(await claude.recognize({ front, back }), "claude")) {
        setNote("Claude could not read any details from these photos.");
      }
    } catch (error) {
      setNote(
        error instanceof DailyLimitError
          ? "The daily limit for Claude identifications is reached. Use on-device recognition or enter the details yourself."
          : error instanceof AuthExpiredError
            ? "Sign in again to use Claude."
            : "Could not identify the card right now. Try again or enter the details yourself.",
      );
    } finally {
      setIdentifying(false);
    }
  }

  const hintFor = (key: string) =>
    suggested[key as DraftKey] ? (flagged.has(key as DraftKey) ? "Suggested · Check this" : "Suggested") : undefined;

  const text = (key: keyof Draft & string, label: string, error?: FieldKey, type = "text") => {
    const message = error && errors[error];
    const required = (REQUIRED_FIELDS as readonly string[]).includes(key);
    return (
      <Field label={label} error={message} hint={hintFor(key)} required={required}>
        <input
          id={fieldId(label)}
          type={type}
          value={draft[key] as string}
          onChange={(e) => edit(key, e.target.value)}
          aria-required={required || undefined}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${fieldId(label)}-error` : undefined}
          disabled={key === "serial" && draft.serialUnreadable}
        />
      </Field>
    );
  };

  const check = (key: keyof Draft & string, label: string) => (
    <label className="check">
      <input type="checkbox" checked={draft[key] as boolean} onChange={(e) => edit(key, e.target.checked)} />
      {label}
    </label>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = toCard(draft, card, origin ?? card?.source ?? "manual");
    const found = validateCard(next);
    setErrors(found);
    const failed = FORM_ORDER.filter((k) => found[k]);
    const labels = failed.map((k) => labelFor(k, draft));
    setBlocked(labels);
    // Focusing scrolls the first problem into view; on a long form the field itself is far from Save.
    if (labels.length > 0) document.getElementById(fieldId(labels[0]))?.focus();
    if (Object.keys(found).length > 0) return;
    const existing = card ? undefined : findDuplicate(cards, next);
    if (existing) setDuplicate({ existing, added: next });
    else await onSave(next, photos);
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2>{card ? "Edit card" : "Add card"}</h2>
      {(["front", "back"] as const).map((side) => (
        <PhotoSlot
          key={side}
          side={side}
          card={card}
          captured={photos[side]}
          onChange={(p) => setPhotos((s) => ({ ...s, [side]: p }))}
          onBusy={(b) => setPreparing((s) => ({ ...s, [side]: b }))}
        />
      ))}
      {(photos.front || photos.back || card?.photos.front || card?.photos.back) && (
        <button type="button" disabled={identifying} onClick={identify}>
          Identify with Claude
        </button>
      )}
      {note && <p role="status">{note}</p>}
      {text("player", "Player", "player")}
      {text("team", "Team")}
      {text("year", "Year", "year", "number")}
      {text("manufacturer", "Manufacturer")}
      {text("set", "Set", "set")}
      {text("subset", "Subset")}
      {text("insert", "Insert")}
      {text("cardNumber", "Card number", "cardNumber")}
      {text("parallel", "Parallel")}
      {check("serialNumbered", "Serial-numbered")}
      {draft.serialNumbered && (
        <>
          {text("serial", "Serial", "serial", "number")}
          {check("serialUnreadable", "Serial unreadable")}
        </>
      )}
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
        <Field label="Condition">
          <select id={fieldId("Condition")} value={draft.condition} onChange={(e) => edit("condition", e.target.value)}>
            <option value="">Not set</option>
            {draft.condition !== "" && !(CONDITIONS as readonly string[]).includes(draft.condition) && (
              <option>{draft.condition}</option>
            )}
            {CONDITIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
      )}
      {text("quantity", "Quantity", "quantity", "number")}
      <Field label="Notes">
        <textarea id={fieldId("Notes")} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      {errors.card && <p role="alert">{errors.card}</p>}
      {blocked.length > 0 && (
        <p role="alert" data-testid="save-blocked">
          Can't save yet. Check: {blocked.join(", ")}.
        </p>
      )}
      <div className="actions">
        <button type="submit" className="primary" disabled={preparing.front || preparing.back}>
          Save
        </button>
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
