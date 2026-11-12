Rebase on `main` first if `scan-back-chain` or `filter-sort-merge` has merged (see design.md). Write each test first, see it fail, then write the code.

## 1. Duplicate prompt as a centred modal dialog (built, kept)

- [x] 1.1 Unit and e2e tests, `CardForm.tsx` markup, focus, `inert` and back-stack handling for the duplicate prompt as a centred alertdialog over a scrim (see "The duplicate-card prompt is a centred dialog"). Verify: its tests pass.

## 2. Revision after the owner's ruling: discard in the bar, matching button styles

- [x] 2.1 Write the failing tests:
  - In `src/app/card-form-actions.test.tsx`: replace the discard-dialog tests (alertdialog, backdrop click, form `inert`) with: Cancel with entries renders "Discard this card?" in `.form-bar` with Discard (`danger outline`) before Keep editing (`primary`, focused), no `.backdrop`, no Cancel or Save button; Keep editing and Escape restore the bar with Player kept and Cancel focused; `openSheets.at(-1)` does the same; Discard calls `onCancel` only after 500 ms (fake timers) and a click right after Cancel does not; the form is not `inert`. Duplicate prompt: Increase quantity has `primary`, the others neither `primary` nor `danger`.
  - A CardDetail test (create `src/app/card-detail.test.tsx` if none asserts the dialog): Delete (`danger outline`) comes before Keep (`primary`, focused) in the Delete dialog.
  - In `e2e/form-bar.spec.ts`: rewrite the discard cases as "The question takes the bar's place" (same bar box, no scrim, equal widths within 1 px, 48 px high), "Pair drawn like Delete and Edit" (computed colours, light and dark), "Double tap on Cancel does not discard" (`dblclick` on Cancel, the question stays, then wait 600 ms and Discard leaves), Escape, Android back, "Short screen" at 360 by 450, "Blocked message kept under the question". Keep the duplicate-prompt cases.
  - In `e2e/design.spec.ts`: drop "discard confirm" from the no-translucent-surface dialog list, keep "duplicate confirm", and adjust the Cancel-left-of-Save test for the new question.
  - Delete dialog order in the existing e2e for it.

  Verify: `npx vitest run src/app/card-form-actions.test.tsx` and `npx playwright test e2e/form-bar.spec.ts e2e/design.spec.ts e2e/catalog.spec.ts` fail only on the new or changed tests.
- [x] 2.2 In `src/app/CardForm.tsx`: remove the discard dialog from the backdrop (it holds only the duplicate prompt), make `inert` follow `!!duplicate` only, render the question and the `.actions.detail-actions` pair in `.form-bar` while `confirming`, add the 500 ms Discard guard (ref set in an effect on `confirming`), close on Escape from the form, and give Increase quantity `className="primary"`.
- [x] 2.3 In `src/app/CardDetail.tsx`: Delete dialog buttons become Delete (`danger outline`) then Keep (`primary`, autofocus) in a `.actions.detail-actions` row. Touch `app.css` only if a gap shows, tokens only.

  Verify 2.1 to 2.3: all the tests from 2.1 pass, and `npx vitest run src/app/back-button.test.tsx` and `npx playwright test e2e/photos.spec.ts` still pass.
- [x] 2.4 Update `DESIGN.md` "Sheets and dialogs": the form's discard question replaces the bar with the Delete/Edit-style pair (Discard outlined danger left, Keep editing filled right, a 500 ms tap guard); the duplicate-card prompt is a centred dialog with the primary action filled and the others outlined; Delete card's dialog uses the same pair. Verify: `git diff DESIGN.md` shows no new token.
- [x] 2.5 Rewrite the "Form prompts over the bar" line in `docs/device-checklist.md`: add form, type a player, tap Cancel twice fast: the bar shows "Discard this card?" with Discard outlined red left and Keep editing filled right, the double tap does not discard, a later Discard leaves, Keep editing and back return with entries kept; the duplicate dialog's Increase quantity is the filled button; the Delete dialog on card detail shows Delete outlined left and Keep filled right. Keep the `[form-dialogs-modal 2.6, T-50]` tag.
- [ ] 2.6 On the phone, run the check from 2.5 with the release build. Verify: the owner ticks the checklist line.
- [x] 2.7 Run `openspec validate form-dialogs-modal --strict` and the repo's check command from `desk.config.json`. Verify: both exit 0.
