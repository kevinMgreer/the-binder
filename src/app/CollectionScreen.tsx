import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Card } from "../domain/card";
import { applyFilters, distinctValues, emptyFilters, sortCards, summarize, type Filters } from "../domain/query";
import { CardList } from "./CardList";
import { Field, fieldId } from "./Field";
import { Sheet } from "./Sheet";
import { SyncIndicator } from "./SyncIndicator";
import { UpdateLink } from "./UpdateLink";
import type { UpdateInfo } from "./useUpdates";

interface Props {
  cards: Card[];
  update: UpdateInfo | null;
  onAdd: () => void;
  onScan: (mode: "camera" | "pick") => void;
  onSettings: () => void;
  onOpen: (card: Card) => void;
}

const FLAG_LABELS = {
  serialNumbered: "Serial-numbered",
  rookie: "Rookie",
  autograph: "Autograph",
  relic: "Relic",
  graded: "Graded",
} as const;

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s));

export function CollectionScreen({ cards, update, onAdd, onScan, onSettings, onOpen }: Props) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sheet, setSheet] = useState<"add" | "filter" | null>(null);
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const shown = useMemo(() => sortCards(applyFilters(cards, filters)), [cards, filters]);
  const { total, distinct } = summarize(cards);
  const teams = useMemo(() => distinctValues(cards, (c) => c.team), [cards]);
  const sets = useMemo(() => distinctValues(cards, (c) => c.set), [cards]);
  const parallels = useMemo(() => distinctValues(cards, (c) => c.parallel?.name), [cards]);

  const select = (key: "team" | "set" | "parallel", label: string, options: string[]) => (
    <Field label={label}>
      <select id={fieldId(label)} value={filters[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );

  const number = (key: "yearFrom" | "yearTo" | "printRun", label: string) => (
    <Field label={label}>
      <input
        id={fieldId(label)}
        type="number"
        value={filters[key] ?? ""}
        onChange={(e) => set(key, toNumber(e.target.value))}
      />
    </Field>
  );

  const check = (key: "serialNumbered" | "rookie" | "autograph" | "relic" | "graded", label: string): ReactNode => (
    <label className="check">
      <input id={fieldId(label)} type="checkbox" checked={filters[key]} onChange={(e) => set(key, e.target.checked)} />
      {label}
    </label>
  );

  const f = filters;
  const applied: { name: string; text: string; clear: Partial<Filters> }[] = [
    ...(f.yearFrom !== null || f.yearTo !== null
      ? [{ name: "Year", text: `Year ${f.yearFrom ?? ""}–${f.yearTo ?? ""}`, clear: { yearFrom: null, yearTo: null } }]
      : []),
    ...(f.team ? [{ name: "Team", text: f.team, clear: { team: "" } }] : []),
    ...(f.set ? [{ name: "Set", text: f.set, clear: { set: "" } }] : []),
    ...(f.parallel ? [{ name: "Parallel", text: f.parallel, clear: { parallel: "" } }] : []),
    ...(f.printRun !== null ? [{ name: "Print run", text: `Print run ${f.printRun}`, clear: { printRun: null } }] : []),
    ...(["serialNumbered", "rookie", "autograph", "relic", "graded"] as const)
      .filter((key) => f[key])
      .map((key) => ({ name: FLAG_LABELS[key], text: FLAG_LABELS[key], clear: { [key]: false } })),
  ];
  const clearAll = () => setFilters((cur) => ({ ...emptyFilters, search: cur.search }));
  const closeSheet = useCallback(() => setSheet(null), []);
  const countLabel = `${shown.length} ${shown.length === 1 ? "card" : "cards"}`;

  return (
    <section className="collection">
      <header>
        <div className="title-row">
          <h1>The Binder</h1>
          <button onClick={onSettings}>Settings</button>
        </div>
        <div className="meta">
          <p data-testid="summary">
            {total} {total === 1 ? "card" : "cards"}, {distinct} distinct
          </p>
          <SyncIndicator />
        </div>
      </header>
      {update && <UpdateLink update={update} />}
      <div className="search-row">
        <Field label="Search">
          <input
            id={fieldId("Search")}
            type="search"
            placeholder="Search"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </Field>
        <button aria-label={applied.length > 0 ? `Filter, ${applied.length} applied` : undefined} onClick={() => setSheet("filter")}>
          Filter
          {applied.length > 0 && <span className="badge">{applied.length}</span>}
        </button>
      </div>
      {applied.length > 0 && (
        <div className="chips">
          {applied.map((a) => (
            <button key={a.name} className="chip" aria-label={`Remove ${a.name} filter${a.text === a.name ? "" : `: ${a.text.replace(`${a.name} `, "")}`}`} onClick={() => setFilters((cur) => ({ ...cur, ...a.clear }))}>
              {a.text}
            </button>
          ))}
        </div>
      )}
      <p className="shown" data-testid="shown">
        Showing {shown.length}
      </p>
      {shown.length > 0 ? (
        <CardList cards={shown} onOpen={onOpen} />
      ) : cards.length === 0 ? (
        <p className="empty" data-testid="empty-state">
          Your binder is empty. Scan a card or add one by hand.
        </p>
      ) : (
        <p className="empty" data-testid="no-match">
          No cards match. Clear the search or a filter.
        </p>
      )}
      <button className="primary add-button" onClick={() => setSheet("add")}>
        Add card
      </button>
      {sheet === "add" && (
        <Sheet label="Add a card" onClose={closeSheet}>
          <button className="primary" onClick={() => onScan("camera")}>
            Scan card
          </button>
          <button onClick={() => onScan("pick")}>Pick from photos</button>
          <button onClick={onAdd}>Enter by hand</button>
        </Sheet>
      )}
      {sheet === "filter" && (
        <Sheet
          label="Filters"
          full
          onClose={closeSheet}
          foot={
            <>
              <button className="primary" onClick={closeSheet}>
                Show {countLabel}
              </button>
              <button onClick={clearAll}>Clear all</button>
            </>
          }
        >
          <div className="group">
            <h3>Year</h3>
            {number("yearFrom", "Year from")}
            {number("yearTo", "Year to")}
          </div>
          <div className="group">
            <h3>Card</h3>
            {select("team", "Team", teams)}
            {select("set", "Set", sets)}
            {select("parallel", "Parallel", parallels)}
          </div>
          <div className="group">
            <h3>Serial number</h3>
            {number("printRun", "Print run")}
            {check("serialNumbered", "Serial-numbered")}
          </div>
          <div className="group">
            <h3>Traits</h3>
            {check("rookie", "Rookie")}
            {check("autograph", "Autograph")}
            {check("relic", "Relic")}
          </div>
          <div className="group">
            <h3>Grade</h3>
            {check("graded", "Graded")}
          </div>
        </Sheet>
      )}
    </section>
  );
}
