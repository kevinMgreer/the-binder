import type { Card } from "./card";
import { isSerialNumbered } from "./format";

export const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export interface Filters {
  search: string;
  yearFrom: number | null;
  yearTo: number | null;
  team: string;
  set: string;
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
  yearFrom: null,
  yearTo: null,
  team: "",
  set: "",
  parallel: "",
  printRun: null,
  serialNumbered: false,
  rookie: false,
  autograph: false,
  relic: false,
  graded: false,
};

export function applyFilters(cards: Card[], f: Filters): Card[] {
  const search = normalize(f.search.trim());
  return cards.filter((c) => {
    if (search && !normalize(`${c.player} ${c.team} ${c.set} ${c.notes}`).includes(search)) return false;
    if (f.yearFrom !== null && c.year < f.yearFrom) return false;
    if (f.yearTo !== null && c.year > f.yearTo) return false;
    if (f.team && c.team !== f.team) return false;
    if (f.set && c.set !== f.set) return false;
    if (f.parallel && c.parallel?.name !== f.parallel) return false;
    if (f.printRun !== null && c.parallel?.printRun !== f.printRun) return false;
    if (f.serialNumbered && !isSerialNumbered(c)) return false;
    if (f.rookie && !c.flags.rookie) return false;
    if (f.autograph && !c.flags.autograph) return false;
    if (f.relic && !c.flags.relic) return false;
    if (f.graded && c.grading.kind !== "graded") return false;
    return true;
  });
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort(
    (a, b) => a.year - b.year || collator.compare(a.set, b.set) || collator.compare(a.cardNumber, b.cardNumber),
  );
}

export function summarize(cards: Card[]) {
  return { total: cards.reduce((n, c) => n + c.quantity, 0), distinct: cards.length };
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
