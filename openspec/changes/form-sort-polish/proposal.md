## Why

Four small things the owner hit on the phone, and one found on the next phone check. The card form puts Save on the left and Cancel on the right, the reverse of what Android apps do, and one stray tap on Cancel throws away a half-entered card with its photos. The Sort sheet borrows the full-height Filters layout, so a sheet with six choices fills the screen, and its radio rows do not line up. The Add item of the bottom bar is only as large as the icons beside it, so it hardly reads as the action. On the screens without the bottom bar (form, detail, Settings) the app draws edge-to-edge, so scrolling fields run under the transparent Android navigation bar and the system buttons are hard to see.

## What Changes

- Card form (add and edit): the action row becomes Cancel on the left (ink-outlined, not primary) and Save on the right (primary, taking the rest of the row).
- Cancel asks first when the form holds anything: any field different from how the form opened, a photo attached, or a suggestion applied. The add form asks "Discard this card?", the edit form "Discard changes?", with Keep editing (focused) and Discard. An untouched form still closes at once. The Android back button on the form asks the same question, and back while the question shows means Keep editing.
- Sort sheet: a bottom sheet as tall as its content, not full height (the Filters sheet stays full height). Order options are one column of equal 48 dp rows on one left edge with the radio in one column; Direction is one row with Ascending and Descending side by side; a footer holds a primary Done button laid out like the Filters footer. A choice still applies at once; Done and Close only close the sheet.
- Bottom navigation: the Add frame stays a solid ink frame but grows from 40 by 24 to 48 by 32 dp with a 24 dp plus (the neighbouring icons are 24 dp), so it is clearly larger than Dashboard and Cards. `aria-current`, the "Add card" name and the 48 dp target stay.
- System navigation bar: a fixed strip as high as the bottom inset, in the ground colour, sits under the system buttons so content never shows behind them. It ignores touches and the bottom bar paints over it.
- Spec text that describes the old look changes with it: the form's button order and the Cancel discard scenario in `card-photos`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `card-form-guidance`: two added requirements: the action order (Cancel left, Save right) and the discard confirmation on Cancel.
- `card-photos`: "Cancel discards" now goes through the confirmation; the result after Discard is unchanged.
- `app-shell`: back on a form with entries asks before leaving; the Add frame of the bottom navigation is 48 by 32 dp; a new requirement for the solid system navigation bar strip.
- `app-theme`: the card-back look lists the form's button order and the Sort sheet.
- `collection-list`: the Sort sheet is compact, aligned, and has a Done footer.

## Out of scope

- New sort fields, saving the chosen sort, or any change to how the list orders cards.
- An undo snackbar for discarded cards, autosaved drafts, or keeping a draft across app restarts.
- Any change to the Filters sheet beyond keeping it full height, and to the other sheets and dialogs.
- Asking before leaving the form any other way than Cancel and Android back (there is no other way off the form today: the bottom bar is hidden there).
- Renaming `openSheets` in `src/app/Sheet.tsx` to a more general back-handler stack.
