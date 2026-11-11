## Why

Four small things the owner hit on the phone. The card form puts Save on the left and Cancel on the right, the reverse of what Android apps do, and one stray tap on Cancel throws away a half-entered card with its photos. The Sort sheet borrows the full-height Filters layout, so a sheet with six choices fills the screen, and its radio rows do not line up. The bottom bar's Add item is a solid ink block, so it reads as the selected tab and hides which page is showing.

## What Changes

- Card form (add and edit): the action row becomes Cancel on the left (ink-outlined, not primary) and Save on the right (primary, taking the rest of the row).
- Cancel asks first when the form holds anything: any field different from how the form opened, a photo attached, or a suggestion applied. The add form asks "Discard this card?", the edit form "Discard changes?", with Keep editing (focused) and Discard. An untouched form still closes at once. The Android back button on the form asks the same question, and back while the question shows means Keep editing.
- Sort sheet: a bottom sheet as tall as its content, not full height (the Filters sheet stays full height). Order options are one column of equal 48 dp rows on one left edge with the radio in one column; Direction is one row with Ascending and Descending side by side; a footer holds a primary Done button laid out like the Filters footer. A choice still applies at once; Done and Close only close the sheet.
- Bottom navigation: the Add frame is drawn outlined (1 px ink border, the bar's panel background, ink plus) and never filled, so only the current destination (Dashboard or Cards) is marked by weight and a solid icon. `aria-current`, the "Add card" name and the 48 dp target stay.
- Spec text that describes the old look changes with it: the form's button order, the Add frame's colours in the palette and token scenarios, and the Cancel discard scenario in `card-photos`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `card-form-guidance`: two added requirements: the action order (Cancel left, Save right) and the discard confirmation on Cancel.
- `card-photos`: "Cancel discards" now goes through the confirmation; the result after Discard is unchanged.
- `app-shell`: back on a form with entries asks before leaving; the Add item of the bottom navigation is an outlined frame.
- `app-theme`: the Add frame's computed colours in the token and palette scenarios; the card-back look lists the form's button order, the Sort sheet and the outlined Add frame.
- `collection-list`: the Sort sheet is compact, aligned, and has a Done footer.

## Out of scope

- New sort fields, saving the chosen sort, or any change to how the list orders cards.
- An undo snackbar for discarded cards, autosaved drafts, or keeping a draft across app restarts.
- Any change to the Filters sheet beyond keeping it full height, and to the other sheets and dialogs.
- Asking before leaving the form any other way than Cancel and Android back (there is no other way off the form today: the bottom bar is hidden there).
- Renaming `openSheets` in `src/app/Sheet.tsx` to a more general back-handler stack.
