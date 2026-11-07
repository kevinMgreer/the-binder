import { useMemo, useState, type ReactNode } from "react";
import type { Card } from "../domain/card";
import { applyFilters, distinctValues, emptyFilters, sortCards, summarize, type Filters } from "../domain/query";
import { CardList } from "./CardList";
import { Field, fieldId } from "./Field";
import { SyncIndicator } from "./SyncIndicator";

interface Props {
  cards: Card[];
  onAdd: () => void;
  onScan: (mode: "camera" | "pick") => void;
  onSettings: () => void;
  onOpen: (card: Card) => void;
}

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s));

export function CollectionScreen({ cards, onAdd, onScan, onSettings, onOpen }: Props) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
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
      <input type="checkbox" checked={filters[key]} onChange={(e) => set(key, e.target.checked)} />
      {label}
    </label>
  );

  return (
    <section className="collection">
      <header>
        <h1>The Binder</h1>
        <p data-testid="summary">
          {total} cards, {distinct} distinct
        </p>
        <button onClick={onAdd}>Add card</button>
        <button onClick={() => onScan("camera")}>Scan card</button>
        <button onClick={() => onScan("pick")}>Pick from photos</button>
        <button onClick={onSettings}>Settings</button>
        <SyncIndicator />
      </header>
      <Field label="Search">
        <input
          id={fieldId("Search")}
          type="search"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </Field>
      <details>
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
      <p data-testid="shown">Showing {shown.length}</p>
      {shown.length > 0 ? <CardList cards={shown} onOpen={onOpen} /> : <p>No cards to show.</p>}
    </section>
  );
}
