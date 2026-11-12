## Why

On the add and edit forms, Cancel on a form with entries shows "Discard this card?" as an inline panel at the end of the form, and the sticky Cancel/Save bar stays visible and tappable right below it. The owner reads that as two sets of buttons for one question. The duplicate-card prompt that Save can show has the same problem, and Android back while it shows leaves the form without asking. The card detail screen already asks "Delete this card?" in a centred modal dialog over a scrim, and the form's prompts should look and behave the same way.

## What Changes

- The discard prompt ("Discard this card?" / "Discard changes?") becomes the same centred modal alertdialog over a scrim as the detail Delete dialog. The scrim covers the whole screen, the Cancel/Save bar included, so nothing behind the dialog can be tapped. The form behind is inert, so TalkBack and keyboard focus stay in the dialog. Keep editing has focus. A scrim tap, Escape and Android back all mean Keep editing, and focus returns to Cancel.
- The duplicate-card prompt (Increase quantity, Add as separate card, Back to form) becomes the same kind of centred modal alertdialog, named "Duplicate card", with its question read as the dialog's description. Back to form, a scrim tap, Escape and Android back all close it without saving, and focus returns to Save. Android back no longer leaves the form while this prompt shows.
- The "Save stays in reach" requirement changes: while either dialog shows, the bar stays in place under the scrim and does not respond to taps. It no longer has to leave room for inline dialogs.
- Unchanged: when a form counts as having entries, the wording, the danger-coloured Discard, Cancel leaving at once on an untouched form, Increase quantity and Add as separate card working as `card-catalog` says, the save-blocked message in the bar, and the back stack order.
- DESIGN.md "Sheets and dialogs" and a phone check line in `docs/device-checklist.md`.

## Out of scope

- Any change to the card detail Delete dialog (its markup, focus handling, or making the detail screen inert).
- New confirmation prompts, or new wording on the existing ones (the duplicate prompt keeps "Back to form").
- The Settings sign-out confirmation and the needs-decision dialog. They stay inline panels.
- Locking page scroll behind the dialog (see design.md).
- Morphing the bar into the prompt (Option B) and a bottom-sheet prompt (Option C). Both were considered and rejected in design.md.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `card-form-guidance`: "Cancel asks before discarding entries" now shows a centred modal dialog over a scrim that covers the bar (scrim, Escape and back mean Keep editing, and focus returns to Cancel). "Save stays in reach" now has the bar covered and not tappable while a form dialog shows. ADDED "The duplicate-card prompt is a centred dialog".

## Impact

- `src/app/CardForm.tsx`: the two prompts move out of the `<form>` into a `div.backdrop.center` sibling, the form gets `inert` while either shows, the back-stack effect gets one more case, and focus returns after the dialog closes.
- Tests: `src/app/card-form-actions.test.tsx`, `e2e/form-bar.spec.ts`, `e2e/design.spec.ts`, and `e2e/catalog.spec.ts` (two duplicate-prompt locators change from `dialog` to `alertdialog`).
- Docs: `DESIGN.md`, `docs/device-checklist.md`.
- No new dependency, token or colour. Expected to need no `app.css` change. The open change `scan-back-chain` also edits `CardForm.tsx` and `card-form-actions.test.tsx` (see design.md).
