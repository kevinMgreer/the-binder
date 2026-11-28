import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Card } from "../domain/card";
import { applyFilters, distinctValues, emptyFilters, sortCards, type Filters, type Sort, type SortBy } from "../domain/query";
import type { BulkPatch } from "../usecases/cards";
import { BottomNav, type Destination } from "./BottomNav";
import { BulkEditSheet } from "./BulkEditSheet";
import { useSelection } from "./useSelection";
import { SettingsButton } from "./SettingsButton";
import { CardGrid } from "./CardGrid";
import type { CardsView } from "./cards-view";
import { CardList } from "./CardList";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, fieldId } from "./Field";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { SyncActions, SyncIndicator } from "./SyncIndicator";
import { UpdateLink } from "./UpdateLink";
import type { UpdateInfo } from "./useUpdates";

interface Props {
  cards: Card[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  sort: Sort;
  onSortChange: (sort: Sort) => void;
  view: CardsView;
  onViewChange: (view: CardsView) => void;
  /** The card the user just came back from; its row or tile is scrolled into view and focused. */
  returnTo?: string;
  update: UpdateInfo | null;
  onAdd: () => void;
  onNavigate: (to: Destination) => void;
  onSettings: () => void;
  onOpen: (card: Card) => void;
  onSaveMany: (ids: string[], patch: BulkPatch) => Promise<void>;
  /** Resolves the ids that could not be deleted. */
  onRemoveMany: (cards: Card[]) => Promise<string[]>;
}

const FLAG_LABELS = {
  serialNumbered: "Serial-numbered",
  rookie: "Rookie",
  autograph: "Autograph",
  relic: "Relic",
  graded: "Graded",
} as const;

const SORT_LABELS: Record<SortBy, string> = { lastName: "Last name", year: "Year", team: "Team", set: "Set" };

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s));

export function CollectionScreen({ cards, filters, onFiltersChange, sort, onSortChange, view, onViewChange, returnTo, update, onAdd, onNavigate, onSettings, onOpen, onSaveMany, onRemoveMany }: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const patch = (changes: Partial<Filters>) => onFiltersChange({ ...filters, ...changes });
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => patch({ [key]: value });

  const shown = useMemo(() => sortCards(applyFilters(cards, filters), sort), [cards, filters, sort]);
  const selection = useSelection(shown);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const beginRef = useRef<HTMLButtonElement>(null);
  const wasSelecting = useRef(false);
  useEffect(() => {
    if (selection.selecting) cancelRef.current?.focus();
    else if (wasSelecting.current) beginRef.current?.focus();
    wasSelecting.current = selection.selecting;
  }, [selection.selecting]);
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
  const closeBulk = useCallback(() => setBulkOpen(false), []);
  const deletingRef = useRef(false);
  const keepCards = useCallback(() => {
    if (deletingRef.current) return;
    setDeleteOpen(false);
    setDeleteError(null);
    // The bar's Delete is still mounted; focus after the dialog's autofocus has gone.
    queueMicrotask(() => deleteRef.current?.focus());
  }, []);
  const confirmDelete = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      const failed = await onRemoveMany(selection.chosen);
      if (failed.length === 0) {
        setDeleteOpen(false);
        selection.cancel();
      } else {
        selection.keep(failed);
        setDeleteError(failed.length === 1 ? "1 card could not be deleted. Try again or keep it." : `${failed.length} cards could not be deleted. Try again or keep them.`);
      }
    } catch {
      setDeleteError("Could not delete the cards. Try again.");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  };
  const List = view === "grid" ? CardGrid : CardList;
  const sortLabel = SORT_LABELS[sort.by];
  const radio = (name: string, label: string, checked: boolean, onChange: () => void) => (
    <label className="check" key={label}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
  const countLabel = `${shown.length} ${shown.length === 1 ? "card" : "cards"}`;

  return (
    <section className="collection">
      {selection.selecting ? (
        <header className="selection-bar" data-testid="selection-bar">
          <h1 className="visually-hidden">Cards</h1>
          <button ref={cancelRef} className="icon-button" aria-label="Cancel" onClick={selection.cancel}>
            <Icon name="close" />
          </button>
          <p className="shown" aria-live="polite"><span className="count">{selection.chosen.length}</span>{" "}<span>selected</span></p>
          <button onClick={selection.selectAll}>Select all</button>
          <button ref={deleteRef} className="icon-button" aria-label="Delete" disabled={selection.chosen.length === 0} onClick={() => { setDeleteError(null); setDeleteOpen(true); }}>
            <Icon name="trash" />
          </button>
          <button className="primary" disabled={selection.chosen.length === 0} onClick={() => setBulkOpen(true)}>Edit</button>
        </header>
      ) : (
        <header>
          <div className="title-row">
            <h1>Cards</h1>
            <SyncIndicator />
            <SettingsButton onClick={onSettings} />
          </div>
          <div className="title-rule" aria-hidden="true" />
          <SyncActions />
        </header>
      )}
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
        <button aria-label={applied.length > 0 ? `Filter and sort, ${applied.length} applied` : "Filter and sort"} onClick={() => setFilterOpen(true)}>
          Filter &amp; sort
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
      <div className="shown-row">
        <p className="shown">
          <span data-testid="shown">Showing {shown.length}</span>
          <span data-testid="order">
            <span aria-hidden="true"> · {sortLabel} {sort.descending ? "↓" : "↑"}</span>
            <span className="visually-hidden">, sorted by {sortLabel}, {sort.descending ? "descending" : "ascending"}</span>
          </span>
        </p>
        {shown.length > 0 && !selection.selecting && (
          <button ref={beginRef} className="icon-button select-cards" aria-label="Select cards" onClick={selection.begin}>
            <Icon name="check" outline />
          </button>
        )}
        <button className="icon-button" aria-label={`${view === "grid" ? "List" : "Grid"} view`} onClick={() => onViewChange(view === "grid" ? "list" : "grid")}>
          <Icon name={view === "grid" ? "list" : "grid"} />
        </button>
      </div>
      {shown.length > 0 ? (
        <List cards={shown} onOpen={onOpen} returnTo={returnTo} selected={selection.selected} onToggle={selection.toggle} onLongPress={selection.add} />
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
      {bulkOpen && (
        <BulkEditSheet
          count={selection.chosen.length}
          options={{ team: teams, manufacturer: manufacturers, set: sets, subset: subsets, insert: inserts, parallel: parallels }}
          onClose={closeBulk}
          onSave={async (patch) => {
            await onSaveMany(selection.chosen.map((c) => c.id), patch);
            setBulkOpen(false);
            selection.cancel();
          }}
        />
      )}
      {deleteOpen && (
        <ConfirmDialog label="Delete cards" onCancel={keepCards}>
          <p>Delete {selection.chosen.length} {selection.chosen.length === 1 ? "card" : "cards"}?</p>
          {deleteError && <p role="status">{deleteError}</p>}
          <div className="actions detail-actions">
            <button className="danger outline" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <button className="primary" autoFocus disabled={deleting} onClick={keepCards}>
              Keep
            </button>
          </div>
        </ConfirmDialog>
      )}
      {filterOpen && (
        <Sheet
          label="Filter and sort"
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
          <div className="group" role="radiogroup" aria-label="Sort by">
            <h3>Sort by</h3>
            {(Object.keys(SORT_LABELS) as SortBy[]).map((by) =>
              radio("sort-by", SORT_LABELS[by], sort.by === by, () => onSortChange({ ...sort, by })),
            )}
          </div>
          <div className="group" role="radiogroup" aria-label="Direction">
            <h3>Direction</h3>
            <div className="pair">
              {radio("sort-direction", "Ascending", !sort.descending, () => onSortChange({ ...sort, descending: false }))}
              {radio("sort-direction", "Descending", sort.descending, () => onSortChange({ ...sort, descending: true }))}
            </div>
          </div>
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
