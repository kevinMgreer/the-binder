import type { Card } from "./card";
import { gradeLabel, isSerialNumbered } from "./format";

export function valueQuery(card: Card): string {
  const { parallel, flags, grading } = card;
  const printRun = parallel && isSerialNumbered(card) && parallel.printRun !== null ? `/${parallel.printRun}` : "";
  return [
    String(card.year),
    card.manufacturer,
    card.set,
    card.player,
    card.cardNumber,
    parallel?.name ?? "",
    printRun,
    flags.rookie ? "RC" : "",
    flags.autograph ? "Auto" : "",
    flags.relic ? "Relic" : "",
    grading.kind === "graded" ? gradeLabel(grading) : "",
  ]
    .map((word) => word.trim())
    .filter(Boolean)
    .join(" ");
}

export function soldPricesUrl(card: Card): string {
  const params = new URLSearchParams({ _nkw: valueQuery(card), LH_Sold: "1", LH_Complete: "1", _sacat: "213" });
  return `https://www.ebay.com/sch/i.html?${params}`;
}
