## Context

Bulk edit (T-62, archived as `2026-11-23-bulk-edit`) added selection mode to the collection list: `useSelection(shown)` in `src/app/useSelection.ts` holds the selected ids and exposes `chosen` (the selected cards the search and filters still show), and `CollectionScreen.tsx` draws the selection bar (Cancel, "N selected", Select all, Edit). It left delete out on purpose. Single-card delete already exists: `deleteCard` in `src/usecases/cards.ts` soft-deletes a card (`deletedAt`, `updatedAt`) and queues each side's `fileId` and `thumbId` with `PhotoStore.queueDelete`; `useCards().remove` calls it, refreshes and calls `sync.notifyChange()`. The detail screen asks through `ConfirmDialog` ("Delete card", Delete danger outline left, Keep primary right with `autoFocus`).

## Goals / Non-Goals

**Goals:**
- Delete the shown selected cards in one confirmed step, with one sync push.
- Report partial failure honestly: failed cards stay selected and are counted.
- Reuse `deleteCard`, `ConfirmDialog`, `useSelection` and the bar as they are.

**Non-Goals:**
- Undo, a bin, a batch `putMany` delete, or any change to the sync engine.

## Decisions

### D1. `deleteCards(deps, cards)` loops `deleteCard` and returns the failed ids

```ts
export async function deleteCards(deps: Deps, cards: Card[]): Promise<string[]>
```

For each card, `await deleteCard(deps, card)` inside its own `try`/`catch`; a throw adds the card's id to the returned `failed` list and the loop goes on. Sequential, not `Promise.all`: Dexie writes queue anyway, and a sequential loop keeps the failed list in order and the test simple. Every card gets the same per-card behaviour as single delete (the soft-delete `put` first, then the photos queued, so a failed `put` queues nothing), so the two paths cannot drift.

Alternatives: a new batch delete with one `putMany` (faster for hundreds of cards, but a second copy of the photo-queue logic and all-or-nothing failure, which hides which cards failed); `Promise.allSettled` (same result, harder to read). $0: local IndexedDB writes only.

### D2. One sync push, from the hook

`useCards` gets `removeMany(cards: Card[]): Promise<string[]>`: `const failed = await deleteCards(...)`, `await refresh()`, then one `sync.notifyChange()`, and returns `failed`. Same shape as `saveMany` in bulk edit. `notifyChange` is called even when every card failed: it is cheap and keeps the call the same shape as `saveMany`.

Alternative: notify per card (N pending-count refreshes, and it reads as N pushes). $0: the existing Drive file write.

### D3. Failed cards stay selected

`useSelection` gets `keep(ids: string[])`, which sets the selection to exactly those ids (selection mode stays on). After `removeMany`:
- `failed.length === 0`: close the dialog and `selection.cancel()`.
- otherwise: `selection.keep(failed)` and the dialog stays open with `<p role="status">` "N card(s) could not be deleted. Try again or keep them." The question re-renders from `chosen`, so it then reads "Delete N cards?" for the failed ones and Delete retries only them.
- `removeMany` itself throws (for example `refresh` fails): the dialog stays open with "Could not delete the cards. Try again.", the selection is left as it was, and nothing says the cards were deleted. This is the `BulkEditSheet` pattern.

Delete is disabled while the request runs, so a double tap cannot start two loops.

Alternative: close the dialog and show the failure in the bar or a toast (the app has no toast, and the bar must stay compact). $0: no cost.

### D4. Bar and dialog in `CollectionScreen`

- `src/app/Icon.tsx`: add `trash` to `PATHS` (Material "delete" path, 24 px viewBox like the others).
- The bar: `<button ref={deleteRef} className="icon-button" aria-label="Delete" disabled={chosen.length === 0} onClick={...}><Icon name="trash" /></button>` between "Select all" and "Edit". The global `button` rule already gives `min-width`/`min-height: var(--target-min)` (48 px); `.selection-bar button:not(.primary)` already makes it borderless. No new CSS is expected; `app.css` changes only if the 360 px screenshot shows a wrap (then tighten the gap, not the target).
- The dialog: `ConfirmDialog label="Delete cards"`, `<p>Delete {noun}?</p>`, the status line, then `.actions.detail-actions` with `button.danger.outline` Delete and `button.primary autoFocus` Keep, copied from `CardDetail.tsx`. Keep and `onCancel` close it and focus `deleteRef`. `ConfirmDialog` already pushes its cancel on `openSheets` above the selection's cancel, so Android back closes the dialog first.
- A new prop `onRemoveMany: (cards: Card[]) => Promise<string[]>` on `CollectionScreen`, wired in `App.tsx` to `useCards().removeMany`.

Alternatives: a text "Delete" button (the owner wants the bar compact); a shared `DeleteDialog` component for detail and bulk (two call sites of ten lines; not worth a new component). $0: no cost.

## Risks / Trade-offs

- `deleteCard` soft-deletes first and queues the photos after, so a failed `put` queues nothing and the card keeps its Drive photos. The order is fixed and tested. If a `queueDelete` fails after the `put`, the card is reported failed but is already deleted; its remaining photos stay on Drive.
- Hundreds of sequential `deleteCard` calls on a phone may take a second or more. → Delete is disabled while it runs; no batch path until the owner reports it is slow.
- The bar now holds Cancel, "N selected", Select all, trash and Edit at 360 px. "N selected" already ellipsizes; the screenshot task checks there is no wrap.

## Open Questions

- Should the trash icon be ink (like the other bar icons) or the danger colour? This design uses ink; the dialog's Delete carries the danger colour.
- Is the failure wording "N cards could not be deleted. Try again or keep them." what the owner wants?
