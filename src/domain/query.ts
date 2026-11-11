import type { Card } from "./card";
import { isSerialNumbered } from "./format";

export const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export interface Filters {
  search: string;
  player: string;
  yearFrom: number | null;
  yearTo: number | null;
  team: string;
  manufacturer: string;
  set: string;
  subset: string;
  insert: string;
  parallel: string;
  printRun: number | null;
  serialNumbered: boolean;
  rookie: boolean;
  autograph: boolean;
  relic: boolean;
  graded: boolean;
}

export const emptyFilters: Filters = {
  search: "",
  player: "",
  yearFrom: null,
  yearTo: null,
  team: "",
  manufacturer: "",
  set: "",
  subset: "",
  insert: "",
  parallel: "",
  printRun: null,
  serialNumbered: false,
  rookie: false,
  autograph: false,
  relic: false,
  graded: false,
};

const key = (s: string | undefined) => normalize((s ?? "").trim());

/** The one predicate behind the list, its chips and the dashboard tiles; filter values are normalized once. */
export function matcher(f: Filters): (c: Card) => boolean {
  const search = key(f.search);
  const player = key(f.player);
  const [team, manufacturer, set, subset, insert, parallel] = [f.team, f.manufacturer, f.set, f.subset, f.insert, f.parallel].map(key);
  return (c) => {
    if (search && !normalize(`${c.player} ${c.team} ${c.set} ${c.subset ?? ""} ${c.insert ?? ""} ${c.notes}`).includes(search)) return false;
    if (player && !normalize(c.player).includes(player)) return false;
    if (f.yearFrom !== null && c.year < f.yearFrom) return false;
    if (f.yearTo !== null && c.year > f.yearTo) return false;
    if (team && key(c.team) !== team) return false;
    if (manufacturer && key(c.manufacturer) !== manufacturer) return false;
    if (set && key(c.set) !== set) return false;
    if (subset && key(c.subset) !== subset) return false;
    if (insert && key(c.insert) !== insert) return false;
    if (parallel && key(c.parallel?.name) !== parallel) return false;
    if (f.printRun !== null && c.parallel?.printRun !== f.printRun) return false;
    if (f.serialNumbered && !isSerialNumbered(c)) return false;
    if (f.rookie && !c.flags.rookie) return false;
    if (f.autograph && !c.flags.autograph) return false;
    if (f.relic && !c.flags.relic) return false;
    if (f.graded && c.grading.kind !== "graded") return false;
    return true;
  };
}

export const applyFilters = (cards: Card[], f: Filters): Card[] => cards.filter(matcher(f));

export type SortBy = "lastName" | "year" | "team" | "set";
export interface Sort {
  by: SortBy;
  descending: boolean;
}
export const defaultSort: Sort = { by: "lastName", descending: false };

/** Sort name, else the player's last name; a team card keeps its whole text. */
export function lastNameKey(c: Card): string {
  const sortName = c.sortName?.trim();
  if (sortName) return sortName;
  const player = c.player.trim();
  const team = normalize(c.team.trim());
  if (team && normalize(player).includes(team)) return player;
  let name = player.split(/\s*[/&]\s*|\s+and\s+/i)[0];
  const suffix = /[\s,]+(?:jr|sr|ii|iii|iv)\.?$/i;
  while (suffix.test(name)) name = name.replace(suffix, "");
  return name.split(/\s+/).pop() || player;
}

const sortKey = (c: Card, by: SortBy): string | number =>
  by === "year" ? c.year : by === "lastName" ? lastNameKey(c) : c[by];

export function sortCards(cards: Card[], sort: Sort = defaultSort): Card[] {
  const keys = new Map(cards.map((c) => [c, sortKey(c, sort.by)]));
  const sign = sort.descending ? -1 : 1;
  return [...cards].sort((a, b) => {
    const [ka, kb] = [keys.get(a)!, keys.get(b)!];
    const primary = typeof ka === "number" ? ka - (kb as number) : collator.compare(ka, kb as string);
    return sign * (primary || a.year - b.year || collator.compare(a.set, b.set) || collator.compare(a.cardNumber, b.cardNumber));
  });
}

export function distinctValues(cards: Card[], pick: (c: Card) => string | undefined): string[] {
  return [...new Set(cards.map(pick).filter((v): v is string => !!v))].sort(collator.compare);
}

function identity(c: Card): string {
  const grade = c.grading.kind === "graded" ? `${c.grading.company}|${c.grading.grade}` : "raw";
  return normalize([c.player, c.year, c.set, c.cardNumber, c.parallel?.name ?? "", grade].join("|").trim());
}

export function findDuplicate(cards: Card[], card: Card): Card | undefined {
  const key = identity(card);
  return cards.find((c) => c.id !== card.id && c.deletedAt === null && identity(c) === key);
}
