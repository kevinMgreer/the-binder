## Context

`src/app/CardForm.tsx` has two prompts:

- The discard prompt, `confirming` state, opened by Cancel when `dirty` or by Android back through `openSheets`. `keepEditing()` closes it and focuses Cancel through `cancelButton`.
- The duplicate prompt, `duplicate` state, set by `submit` when `findDuplicate` matches. It is a centred `alertdialog` over a scrim (`div.backdrop.center`, a sibling of the form). While it shows the form is `inert`, and `backToForm()` closes it and focuses Save. Android back closes it instead of leaving the form.

`.form-bar` is `position: sticky` and holds the save-blocked message and the Cancel/Save `.actions` row. Card detail draws its Delete/Edit pair as `.actions.detail-actions`: `button.danger.outline` on the left, `button.primary` on the right, `flex: 1` each. Its Delete dialog is a centred `alertdialog` with a Keep / Delete pair.

The first version of this change made the discard question a centred modal too. The owner tried it and rejected it: the two buttons were different styles that did not fit the look, and a dimmed screen is heavy for a two-choice question.

## Decisions

- **The discard question replaces the bar in place.** When `confirming`, the bar renders the question (`<p role="alert">`) and one `.actions.detail-actions` row instead of the Cancel/Save row: `button.danger.outline` Discard on the left, `button.primary` Keep editing (autofocus) on the right. The save-blocked message stays above, as today, so it is still there after Keep editing. No scrim, no `inert`: the question is in the bar and the fields above stay editable. A field tap does not dismiss it; Keep editing, Escape (an `onKeyDown` on the form) and Android back do. `danger outline` and `primary` already exist, so no new CSS or token is expected.
  Why: it matches the pair the owner already likes on card detail, keeps the thumb at the bottom, and shows one set of buttons.
  Rejected: the centred discard dialog (owner ruling); a bottom sheet (a third dismiss control for a two-choice question).

- **Tap safety: Discard ignores taps for 500 ms after the question appears.** Cancel and Discard are both on the left, so a double tap on Cancel would put its second tap on Discard and throw away the entry. `useEffect` on `confirming` stores `performance.now()` in a ref when the question opens; Discard's `onClick` returns early while less than 500 ms have passed. This covers Cancel, Android back and any other way in. A person reading the question needs longer than that, so the delay is invisible in use. Keep editing is on the right, so a stray tap there is harmless, and it holds focus, so Enter or Space keeps editing.
  Rejected: ignoring only the click that opened it (a double tap's second click is a separate one); putting Keep editing on the left (the owner fixed the order); a disabled-looking Discard (a visible state that flickers).
  The delay is a constant in `CardForm.tsx`. The unit test uses fake timers and the e2e test double-clicks Cancel, then waits and taps Discard.

- **Focus returns to Cancel after Keep editing.** The bar swaps its content, so Cancel is a new element after the close. `keepEditing()` closes with `flushSync(() => setConfirming(false))` and then focuses Cancel through `cancelButton`.

- **The duplicate prompt stays a centred modal, restyled.** Markup, `inert`, scrim, focus and the one back-stack entry stay as built. Increase quantity gets `primary` (filled), Add as separate card and Back to form stay the default outlined button, and none is `danger`.

- **Card detail's Delete dialog stays a dialog; its buttons match.** `Delete` (`danger outline`) first, `Keep` (`primary`, autofocus) second, in the same `.actions` row, equal width through `.actions button`-style flex (the existing `.actions .primary { flex: 1 }` only grows the primary one, so the dialog row gets `detail-actions` too). The Delete dialog's e2e and unit tests that click by name keep working; any that rely on order are updated.

- **Back stack.** One entry for whichever is on top: `backToForm` when `duplicate`, else `keepEditing` when `confirming`, else `() => setConfirming(true)` when `dirty`. Unchanged from the first version.

## Overlap with `scan-back-chain` and `filter-sort-merge`

`scan-back-chain` (PR #42) adds a `backSlot` ref beside `cancelButton` in `CardForm.tsx` and appends tests and a checklist line. `filter-sort-merge` (now on `main`) edits `DESIGN.md`, `docs/device-checklist.md`, `e2e/catalog.spec.ts` and `e2e/design.spec.ts`; the checklist lines were append-only and kept both. Both changes MODIFY the app-theme requirement "Every screen wears the card-back look", and a MODIFIED block replaces the whole requirement. This change's app-theme delta is therefore based on the text of `main` after `filter-sort-merge` merged, so it keeps that change's Filter and sort lines. If another change modifies the same requirement before this one archives, re-base the delta on the then-current text.

## Risks / Trade-offs

- [A 500 ms guard makes a deliberate quick Cancel then Discard do nothing] → Only a tap within half a second of the question appearing is ignored; the question stays and the user taps again. Accepted, and the phone check covers it.
- [Fields stay editable while the question shows] → Harmless: Keep editing, Escape and back all return to the form with changes kept, and Discard still discards everything. If the user edits and the form becomes clean, the question stays until answered.
- [`flushSync` forces a synchronous render on a tap] → One small form re-render on a user action.

## Migration Plan

None. The UI change ships with the next release build. Archive after the phone check.

## Open Questions

- Should the duplicate prompt focus Back to form (the safe choice) instead of Increase quantity? Not changed: Increase quantity is not destructive and is the usual answer.
