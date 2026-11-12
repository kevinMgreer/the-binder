Implement after `scan-back-chain` merges: rebase on `main` first (see design.md, "Overlap with scan-back-chain"). One implementer group. Write each test first, see it fail, then write the code.

## 1. Form prompts as centred modal dialogs

- [x] 1.1 In `src/app/card-form-actions.test.tsx`, write the failing unit tests for the MODIFIED "Cancel asks before discarding entries" and the ADDED "The duplicate-card prompt is a centred dialog":
  - The discard alertdialog has `aria-modal="true"`, sits inside a `.backdrop.center` that is not inside the `<form>`, and its Discard has the `danger` class and not `primary`.
  - The `<form>` has the `inert` attribute while the discard prompt or the duplicate prompt shows, and loses it after either closes.
  - A click on the backdrop and an Escape keydown each close the discard prompt without calling `onCancel`, keep "Hank Aaron" in Player, and leave Cancel focused.
  - The duplicate prompt is `alertdialog` "Duplicate card", described by "This card is already in your collection (1 owned).", with buttons in the order Increase quantity, Add as separate card, Back to form and Increase quantity focused.
  - Back to form, a backdrop click, Escape and `openSheets.at(-1)` each close the duplicate prompt with `onSave` not called, the typed fields kept, and Save focused. Change the existing "back with the duplicate prompt open shows no discard dialog" test to also assert that the prompt closed and the form is still rendered.
  - Increase quantity calls `onSave` with the existing card at quantity 2, and Add as separate card calls `onSave` with the new card.
  - Back after the duplicate prompt closed opens "Discard this card?".

  Verify: `npx vitest run src/app/card-form-actions.test.tsx` fails only on the new or changed tests.
- [x] 1.2 Write the failing e2e tests at 360 by 800 with the 48 px inset, in light and dark:
  - In `e2e/form-bar.spec.ts` (reuse `openForm`):
    - "Centred over the bar": the dialog is in the viewport at ratio 1 and centred within 8 px, `document.elementFromPoint` at Save's centre is not inside `.form-bar`, and Discard's colour is the danger colour.
    - "Scrim tap keeps editing": `page.mouse.click` at Save's centre closes the dialog, Player keeps its value and Cancel is focused.
    - "Escape keeps editing".
    - "Form behind is out of reach": `page.getByLabel("Player").evaluate(el => el.focus())` leaves `document.activeElement` inside the dialog.
    - "Bar not tappable under a dialog", for the discard and the duplicate prompt, using the Cancel point and the Save point: no row is added.
    - "Blocked message kept under the dialog".
    - "Fully visible on a short screen" at 360 by 450 for both prompts.
    - For the duplicate prompt (seed one card as `e2e/catalog.spec.ts` does): "Prompt centred over the bar", "Back to form keeps the entries" and "Android back keeps the form" (`hardwareBack` from `e2e/helpers.ts`, then Save focused and the form still showing).
  - In `e2e/design.spec.ts`: add "discard confirm" and "duplicate confirm" entries next to "delete confirm" in the no-translucent-surface list near line 747. In "Cancel sits left of a wider Save…" (near line 1106), also assert that the dialog is centred and that Cancel is focused after the second back.
  - In `e2e/catalog.spec.ts` lines 152 and 163, change `getByRole("dialog")` to `getByRole("alertdialog", { name: "Duplicate card" })`.

  Verify: `npx playwright test e2e/form-bar.spec.ts e2e/design.spec.ts e2e/catalog.spec.ts` fails only on the new tests.
- [x] 1.3 In `src/app/CardForm.tsx`, change `CardForm`:
  - Return a fragment: the `<form inert={confirming || !!duplicate}>` with the bar still last in it, then one `div.backdrop.center` (`onClick` and Escape `onKeyDown` close the open prompt) holding the prompt's `role="alertdialog" aria-modal="true"` panel with `stopPropagation`, as in `src/app/CardDetail.tsx`.
  - The discard panel puts Keep editing (autofocus) and `.danger` Discard in `.actions`.
  - The duplicate panel keeps its buttons and order, gets `aria-describedby` on its message, and changes role to `alertdialog`.
  - Add a `saveButton` ref.
  - `keepEditing()` and a new `backToForm()` close with `flushSync` (from `react-dom`) and then focus Cancel or Save.
  - The back-stack `useEffect` pushes `backToForm` when `duplicate` is set, otherwise `keepEditing` when `confirming`, otherwise `() => setConfirming(true)` when `dirty`.
  - Drop the comment above `.form-bar` about dialogs.
  - Touch `src/app/app.css` only if a gap shows, with tokens only.

  Verify: 1.1 and 1.2 pass, and `npx vitest run src/app/back-button.test.tsx` and `npx playwright test e2e/photos.spec.ts` still pass.
- [x] 1.4 Update `DESIGN.md` "Sheets and dialogs": the form's discard and duplicate-card prompts are the same centred panel over the scrim as Delete card (Keep editing / Increase quantity focused; the scrim, Escape and Android back mean Keep editing / Back to form; the form behind is inert). "Other confirm and needs-decision dialogs are inline panels" then names only sign-out and the needs-decision dialog. Verify: `git diff DESIGN.md` shows the paragraph change and no new token.
- [x] 1.5 Add a phone check to `docs/device-checklist.md` under "Card-Back look", after the Cards grid line: "- [ ] **Form prompts over the bar.** In light and dark, on the add form: type a player and tap Cancel: "Discard this card?" shows centred over a dimmed screen, the Cancel/Save bar under it does nothing when tapped, and tapping the dim area, back or Keep editing returns to the form with everything kept; Discard leaves. Save a card already in the collection: "Duplicate card" shows the same way and back returns to the form (it no longer leaves it). With TalkBack on, the question is read and swiping stays on the dialog's buttons; dragging on the dim area does not move the dialog. [form-dialogs-modal 1.7, T-50]". Verify: the line is in the file.
- [x] 1.6 Run `openspec validate form-dialogs-modal --strict` and the repo's check command from `desk.config.json`. Verify: both exit 0.
- [ ] 1.7 On the phone, run the check from 1.5 with the release build. Verify: the owner ticks the checklist line.
