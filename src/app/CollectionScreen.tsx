import { useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { Card } from "../domain/card";
import { applyFilters, distinctValues, emptyFilters, sortCards, summarize, type Filters } from "../domain/query";
import { CardList } from "./CardList";
import { Field, fieldId } from "./Field";
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

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s));

export function CollectionScreen({ cards, update, onAdd, onScan, onSettings, onOpen }: Props) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [panelOpen, setPanelOpen] = useState(false);
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
  const groups = [
    { label: "Year", first: "Year from", active: f.yearFrom !== null || f.yearTo !== null },
    { label: "Team", first: "Team", active: f.team !== "" },
    { label: "Set", first: "Set", active: f.set !== "" },
    { label: "Parallel", first: "Parallel", active: f.parallel !== "" },
    { label: "Serial", first: "Print run", active: f.printRun !== null || f.serialNumbered },
    { label: "Traits", first: "Rookie", active: f.rookie || f.autograph || f.relic },
    { label: "Graded", first: "Graded", active: f.graded },
  ];

  // The panel must be open before its field can take focus.
  const openPanel = (first: string) => {
    flushSync(() => setPanelOpen(true));
    document.getElementById(fieldId(first))?.focus();
  };

  return (
    <section className="collection">
      <header>
        <div className="title-row">
          <h1>The Binder</h1>
          <button onClick={onSettings}>Settings</button>
        </div>
        <div className="meta">
          <p data-testid="summary">
            {total} cards, {distinct} distinct
          </p>
          <SyncIndicator />
        </div>
        <div className="actions">
          <button className="primary" onClick={() => onScan("camera")}>
            Scan card
          </button>
          <button onClick={onAdd}>Add card</button>
          <button onClick={() => onScan("pick")}>Pick from photos</button>
        </div>
      </header>
      {update && <UpdateLink update={update} />}
      <Field label="Search">
        <input
          id={fieldId("Search")}
          type="search"
          placeholder="Search"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </Field>
      <div className="chips">
        {groups.map((g) => (
          <button key={g.label} type="button" className="chip" aria-pressed={g.active} onClick={() => openPanel(g.first)}>
            {g.label}
          </button>
        ))}
      </div>
      <details open={panelOpen} onToggle={(e) => setPanelOpen(e.currentTarget.open)}>
        <summary>Filters</summary>
        {number("yearFrom", "Year from")}
        {number("yearTo", "Year to")}
        {select("team", "Team", teams)}
        {select("set", "Set", sets)}
        {select("parallel", "Parallel", parallels)}
        {number("printRun", "Print run")}
        {check("serialNumbered", "Serial-numbered")}
        {check("rookie", "Rookie")}
        {check("autograph", "Autograph")}
        {check("relic", "Relic")}
        {check("graded", "Graded")}
      </details>
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
    </section>
  );
}
