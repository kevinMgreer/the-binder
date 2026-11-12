## Why

On the add and edit forms, Cancel on a form with entries shows "Discard this card?" as an inline panel at the end of the form, and the sticky Cancel/Save bar stays visible and tappable right below it. The owner reads that as two sets of buttons for one question. The duplicate-card prompt that Save can show has the same problem, and Android back while it shows leaves the form without asking.

A first version made both prompts centred modal dialogs over a scrim. The owner tried it and rejected the discard dialog: its two buttons were different styles and did not fit the app's look, and a dimmed screen is too heavy for a two-choice question. Card detail's Delete and Edit pair is the look to copy: outlined danger on the left, filled primary on the right, equal width.

## What Changes

- The discard question ("Discard this card?" / "Discard changes?") is no longer a dialog. On Cancel or Android back with entries, the form's bottom Cancel/Save bar is replaced in place by the question and two equal-width buttons: Discard (outlined danger, left) and Keep editing (filled primary, right). No scrim, nothing centred. Keep editing has focus. Android back and Escape mean Keep editing, and focus returns to Cancel.
- Cancel is on the left and Discard is on the left, so a double tap on Cancel would land on Discard. Discard ignores taps for a short moment after the question appears (design.md).
- The duplicate-card prompt (Increase quantity, Add as separate card, Back to form) stays a centred modal alertdialog over a scrim. Its buttons are restyled: Increase quantity filled primary, the other two outlined, none in the danger colour.
- Card detail's Delete dialog stays a dialog, but its buttons match the pair: Delete outlined danger on the left, Keep filled primary on the right. Wording, focus on Keep, scrim and back handling are unchanged.
- The "Save stays in reach" requirement changes: the bar is replaced by the discard question while it shows, and stays under the duplicate dialog's scrim, not tappable.
- Unchanged: when a form counts as having entries, the wording, Cancel leaving at once on an untouched form, Increase quantity and Add as separate card working as `card-catalog` says, the save-blocked message in the bar, and the back stack order.
- DESIGN.md "Sheets and dialogs" and the phone check line in `docs/device-checklist.md`.

## Out of scope

- New confirmation prompts, or new wording on the existing ones.
- The Settings sign-out confirmation and the needs-decision dialog. They stay inline panels.
- Locking page scroll behind the duplicate dialog.
- A bottom-sheet prompt, and a centred discard dialog (the owner rejected it).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `card-form-guidance`: "Cancel asks before discarding entries" now replaces the bar with the question and a Discard / Keep editing pair, with a tap guard. "Save stays in reach" covers the bar being replaced and covered. ADDED "The duplicate-card prompt is a centred dialog" with restyled buttons.
- `collection-list`: "Delete asks in a centred dialog" now draws Delete outlined danger on the left and Keep filled on the right.
- `app-theme`: "Every screen wears the card-back look" now describes the form's discard question as the bar pair, not a dialog.

## Impact

- `src/app/CardForm.tsx`: the discard question renders in the bar, the duplicate prompt stays a `div.backdrop.center` sibling of the form, with `inert` only for the duplicate prompt.
- `src/app/CardDetail.tsx`: Delete dialog button order and classes.
- Tests: `src/app/card-form-actions.test.tsx`, a CardDetail unit test if one asserts order, `e2e/form-bar.spec.ts`, `e2e/design.spec.ts`, `e2e/catalog.spec.ts`.
- Docs: `DESIGN.md`, `docs/device-checklist.md`.
- No new dependency, token or colour. The open changes `scan-back-chain` and `filter-sort-merge` touch the same files (see design.md).
