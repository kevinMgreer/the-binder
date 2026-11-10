import type { Suggestion } from "../domain/card";

const MANUFACTURERS = ["Topps", "Bowman", "Panini", "Donruss", "Upper Deck", "Fleer", "Score", "Leaf"];
const SETS = [
  "Chrome", "Heritage", "Update", "Series 1", "Series 2", "Prizm", "Optic", "Select", "Mosaic", "Stadium Club", "Allen & Ginter", "Gypsy Queen",
];

const SERIAL_LINE = /^(\d{1,4}|\?{1,2})\s*\/\s*(\d{1,4})$/;
const COPYRIGHT_YEAR = /(?:©|\(c\)|copyright)\s*((?:19|20)\d\d)\b/i;
const ANY_YEAR = /\b((?:19|20)\d\d)\b/;
const LABELLED_NUMBER = /(?:\bNO\b\.?|#)\s*([A-Z]{0,4}\d{1,4}(?:-\d{1,3})?)\b/i;
const STANDALONE_NUMBER = /^(?:[A-Z]{1,4}-?\d{1,4}|\d{1,3})$/;

/** First entry of `names` found in `text` as whole words, by position in the text. */
function firstKnown(text: string, names: string[]): string | undefined {
  const escaped = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hits = names
    .map((name) => ({ name, at: text.search(new RegExp(`(?<![\\p{L}\\d])${escaped(name)}(?![\\p{L}\\d])`, "iu")) }))
    .filter((hit) => hit.at >= 0);
  return hits.sort((a, b) => a.at - b.at)[0]?.name;
}

/**
 * Turns the text ML Kit reads off a card into form suggestions.
 * shortcut: without a copyright mark the first plausible year in the text wins, which can be a stats-table year; a checklist-backed parser would fix it.
 */
export function parseCardText(text: string, now = new Date()): Suggestion {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const suggestion: Suggestion = {};
  const plausible = (year: number) => year >= 1950 && year <= now.getFullYear();

  const copyright = Number(text.match(COPYRIGHT_YEAR)?.[1]);
  const otherYear = lines
    .filter((line) => !SERIAL_LINE.test(line))
    .map((line) => Number(line.match(ANY_YEAR)?.[1]))
    .find(plausible);
  const year = plausible(copyright) ? copyright : otherYear;
  if (year) suggestion.year = year;

  const number = text.match(LABELLED_NUMBER)?.[1] ?? lines.find((line) => STANDALONE_NUMBER.test(line));
  if (number) suggestion.cardNumber = number.toUpperCase();

  const manufacturer = firstKnown(text, MANUFACTURERS);
  if (manufacturer) suggestion.manufacturer = manufacturer;
  const set = firstKnown(text, SETS);
  if (set) suggestion.set = set;

  for (const line of lines) {
    const [, serial, run] = line.match(SERIAL_LINE) ?? [];
    if (!run || (serial !== "?" && serial !== "??" && Number(serial) > Number(run))) continue;
    const legible = /^\d/.test(serial);
    suggestion.parallel = { name: "", serial: legible ? Number(serial) : null, serialLegible: legible, printRun: Number(run) };
    break;
  }
  return suggestion;
}
