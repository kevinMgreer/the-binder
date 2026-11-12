export type CardsView = "list" | "grid";

export const loadCardsView = (): CardsView => "list";

export const saveCardsView = (_view: CardsView): void => {};
