export type CardsView = "list" | "grid";

const KEY = "binder.cardsView";

// A WebView with storage disabled or full must not break the screen: fall back to the list silently.
export function loadCardsView(): CardsView {
  try {
    return localStorage.getItem(KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

export function saveCardsView(view: CardsView): void {
  try {
    localStorage.setItem(KEY, view);
  } catch {
    // The view stays chosen for this run; it just is not kept.
  }
}
