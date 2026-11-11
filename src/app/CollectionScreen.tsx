import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Card } from "../domain/card";
import { applyFilters, distinctValues, emptyFilters, sortCards, type Filters } from "../domain/query";
import { BottomNav, type Destination } from "./BottomNav";
import { SettingsButton } from "./SettingsButton";
import { CardList } from "./CardList";
import { Field, fieldId } from "./Field";
import { Sheet } from "./Sheet";
import { SyncActions, SyncIndicator } from "./SyncIndicator";
import { UpdateLink } from "./UpdateLink";
import type { UpdateInfo } from "./useUpdates";

interface Props {
  cards: Card[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  update: UpdateInfo | null;
  onAdd: () => void;
  onNavigate: (to: Destination) => void;
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

export function CollectionScreen({ cards, filters, onFiltersChange, update, onAdd, onNavigate, onSettings, onOpen }: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const patch = (changes: Partial<Filters>) => onFiltersChange({ ...filters, ...changes });
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => patch({ [key]: value });

  const shown = useMemo(() => sortCards(applyFilters(cards, filters)), [cards, filters]);
  const teams = useMemo(() => distinctValues(cards, (c) => c.team), [cards]);
  const sets = useMemo(() => distinctValues(cards, (c) => c.set), [cards]);
  const parallels = useMemo(() => distinctValues(cards, (c) => c.parallel?.name), [cards]);
  const manufacturers = useMemo(() => distinctValues(cards, (c) => c.manufacturer), [cards]);
  const subsets = useMemo(() => distinctValues(cards, (c) => c.subset), [cards]);
  const inserts = useMemo(() => distinctValues(cards, (c) => c.insert), [cards]);

  type TextKey = "team" | "manufacturer" | "set" | "subset" | "insert" | "parallel";
  const select = (key: TextKey, label: string, options: string[]) => (
    <Field label={label}>
      <select id={fieldId(label)} value={filters[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">Any</option>
        {/* A tile's value may not match any card's spelling; it must still show as selected. */}
        {filters[key] && !options.includes(filters[key]) && <option>{filters[key]}</option>}
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
    ...(f.player.trim() ? [{ name: "Player", text: f.player.trim(), clear: { player: "" } }] : []),
    ...(f.team ? [{ name: "Team", text: f.team, clear: { team: "" } }] : []),
    ...(f.manufacturer ? [{ name: "Manufacturer", text: f.manufacturer, clear: { manufacturer: "" } }] : []),
    ...(f.set ? [{ name: "Set", text: f.set, clear: { set: "" } }] : []),
    ...(f.subset ? [{ name: "Subset", text: f.subset, clear: { subset: "" } }] : []),
    ...(f.insert ? [{ name: "Insert", text: f.insert, clear: { insert: "" } }] : []),
    ...(f.parallel ? [{ name: "Parallel", text: f.parallel, clear: { parallel: "" } }] : []),
    ...(f.printRun !== null ? [{ name: "Print run", text: `Print run ${f.printRun}`, clear: { printRun: null } }] : []),
    ...(["serialNumbered", "rookie", "autograph", "relic", "graded"] as const)
      .filter((key) => f[key])
      .map((key) => ({ name: FLAG_LABELS[key], text: FLAG_LABELS[key], clear: { [key]: false } })),
  ];
  const clearAll = () => onFiltersChange({ ...emptyFilters, search: filters.search });
  const closeSheet = useCallback(() => setFilterOpen(false), []);
  const countLabel = `${shown.length} ${shown.length === 1 ? "card" : "cards"}`;

  return (
    <section className="collection">
      <header>
        <div className="title-row">
          <h1>Cards</h1>
          <SyncIndicator />
          <SettingsButton onClick={onSettings} />
        </div>
        <div className="title-rule" aria-hidden="true" />
        <SyncActions />
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
        <button aria-label={applied.length > 0 ? `Filter, ${applied.length} applied` : undefined} onClick={() => setFilterOpen(true)}>
          Filter
          {applied.length > 0 && <span className="badge">{applied.length}</span>}
        </button>
      </div>
      {applied.length > 0 && (
        <div className="chips">
          {applied.map((a) => (
            <button key={a.name} className="chip" aria-label={`Remove ${a.name} filter${a.text === a.name ? "" : `: ${a.text.replace(`${a.name} `, "")}`}`} onClick={() => patch(a.clear)}>
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
      <BottomNav active="list" onNavigate={onNavigate} onAdd={onAdd} />
      {filterOpen && (
        <Sheet
          label="Filters"
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
            <div className="pair">
              {number("yearFrom", "Year from")}
              {number("yearTo", "Year to")}
            </div>
          </div>
          <div className="group">
            <h3>Card</h3>
            <Field label="Player">
              <input id={fieldId("Player")} value={filters.player} onChange={(e) => set("player", e.target.value)} />
            </Field>
            {select("team", "Team", teams)}
            {select("manufacturer", "Manufacturer", manufacturers)}
            {select("set", "Set", sets)}
            {select("subset", "Subset", subsets)}
            {select("insert", "Insert", inserts)}
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
