import type { Card, CardSide } from "../domain/card";

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function photoFileName(card: Card, side: CardSide): string {
  const maker = card.manufacturer.trim() || card.set;
  const parts = [card.year, slug(maker), slug(card.cardNumber), slug(card.player), side, card.id.slice(0, 8)];
  return `${parts.join("-")}.webp`;
}

export function thumbFileName(card: Card, side: CardSide): string {
  return `${card.id}-${side}.webp`;
}
