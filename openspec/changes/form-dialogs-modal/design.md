## Context

`src/app/CardForm.tsx` renders two prompts inline inside the `<form>`, after the Notes field and before `.form-bar`:

- The discard prompt: `div[role=alertdialog][aria-label={question}]` with Keep editing (autofocus) and a `.danger` Discard. `confirming` state, opened by Cancel when `dirty` or by Android back through `openSheets`. `keepEditing()` closes it and focuses Cancel through `cancelButton`.
- The duplicate prompt: `div[role=dialog][aria-modal=true][aria-label="Duplicate card"]` with the message, Increase quantity (autofocus), Add as separate card and Back to form. `duplicate` state, set by `submit` when `findDuplicate` matches. While it shows, the back-stack effect returns early and pushes nothing, so Android back falls through to `App`'s `goBack` and leaves the form without asking. That is a latent bug, fixed here.

`.form-bar` is `position: sticky` at `z-index: 1` and is always visible, so an inline prompt shows its buttons above the bar's Cancel and Save. Those stay tappable and say the opposite thing. `src/app/CardDetail.tsx` already solves this for Delete: `div.backdrop.center` (fixed, inset 0, `z-index: 10`, `--color-scrim`, insets as padding) holding `div[role=alertdialog][aria-modal=true]`. `onClick` on the backdrop and `Escape` mean Keep, the panel stops propagation, Keep is autofocused, `openSheets` makes back mean Keep, and focus goes back to Delete. `app.css` already sizes `.backdrop.center [role="alertdialog"]` (320 px wide at most). The backdrop covers the bar (`z-index: 1`) and the `body::after` system-bar strip (`z-index: 0`).

## Goals / Non-Goals

**Goals:** one answer per question on screen: the prompt's buttons are the only tappable ones. Both form prompts look and behave like the Delete dialog. Every existing behaviour stays: dirty detection, the wording, danger Discard, no prompt on an untouched form, the duplicate flow, and the save-blocked message in the bar.

**Non-Goals:** changing the Delete dialog, adding prompts, changing wording, locking scroll.

## Decisions

- **Option A: both prompts become the Delete dialog's centred modal over a scrim.** `CardForm` returns a fragment: the `<form>` as today (the bar stays last in it), then, when `confirming` or `duplicate` is set, one `div.backdrop.center` with `onClick` = close and `onKeyDown` Escape = close, holding the `role="alertdialog" aria-modal="true"` panel with `onClick={(e) => e.stopPropagation()}`. This is the markup `CardDetail` uses. The discard panel puts its buttons in `.actions` (Keep editing autofocused, then `.danger` Discard) like Delete's. The duplicate panel keeps its message and its three buttons stacked full width, in today's order, with Increase quantity still autofocused. Its role changes from `dialog` to `alertdialog` to match, and it gets `aria-describedby` on the message `<p>` so TalkBack reads the question, not just "Duplicate card". The buttons stay `type="button"`, and outside the `<form>` none of them can submit it. No `app.css` change is expected: the panel styles and `.backdrop.center` exist. If a gap shows, use tokens only. Remove the comment above `.form-bar` about dialogs scrolling above the bar, because it stops being true.
  Why A over B: A matches the Delete dialog the owner already uses on the detail screen (one confirm pattern for destructive choices in the app). It covers the bar by construction, so the bar's validation messages stay put and keep their meaning after Keep editing. It already handles insets and the system-bar strip, needs no new CSS, and fits the duplicate prompt's long sentence and three buttons in a 320 px panel. B wins on thumb reach (the buttons stay at the bottom), but a centred panel on a 360 by 800 phone puts its buttons at mid-screen, which is reachable one-handed.
  Alternatives: **B, the bar morphs in place** ("Discard this card?" + Keep editing / Discard replace Cancel / Save, no overlay). The form above stays scrollable and tappable, so a field tap mid-question leaves the prompt open with nothing that dismisses it. The save-blocked message shares the bar and must be hidden or stacked with the question. The duplicate prompt's sentence plus three 48 dp buttons make a bar about 250 dp tall, a third of the screen. It is a second, form-only confirm pattern next to the Delete dialog. Back and focus handling would be new code rather than a copy. **C, a bottom sheet** (`Sheet compact`): a head with a Close button is a third dismiss control for a two-choice question, the sheet's title and Close duplicate Keep editing, and DESIGN.md keeps sheets for choosers, not confirmations. **Keep inline, hide the bar while asking**: the bar would jump away and back, the panel would stay in the scroll flow (out of view if the user scrolled), and the form fields would stay tappable. $0: markup only.

- **The form is `inert` while a prompt shows; no scroll lock.** `<form inert={confirming || !!duplicate}>` (React 19 renders the boolean attribute). The dialog is a sibling, so it stays live. `inert` keeps TalkBack's swipe navigation and keyboard Tab inside the dialog. The scrim already blocks taps, and `aria-modal` alone is not reliably honoured by every WebView build. Scroll is not locked: the dialog is fixed and centred, so a drag on the scrim that scrolls the document behind cannot move it or reveal anything tappable, and the Delete dialog does not lock either.
  Alternatives: `aria-modal` only, like the Delete dialog (TalkBack may still reach fields behind it); `createPortal` to `body` plus `inert` on `#root` (more moving parts for the same result); `overflow: hidden` on `body` while open (layout jump when the scrollbar goes, and a second piece of global state to restore). $0: platform attribute.

- **Focus returns after the form is no longer inert.** An inert element cannot take focus, so `keepEditing()` must not call `focus()` in the same tick it clears `confirming`. Close with `flushSync(() => setConfirming(false))` (from `react-dom`), then focus Cancel. The duplicate close (`backToForm()`, for Back to form, the scrim, Escape and back) does the same with `setDuplicate(undefined)` and a new `saveButton` ref on the submit button. jsdom does not enforce `inert` on focus, so only the Playwright tests catch a regression here. They assert focus.
  Alternatives: a `useEffect` on `confirming` that focuses Cancel when it turns false (it also fires on mount and needs a "was open" flag); focus the element in a `requestAnimationFrame` (timing-dependent). $0: none.

- **One back-stack entry for whichever prompt is on top.** The existing effect becomes: when `duplicate` is set, push `backToForm`; otherwise when `confirming`, push `keepEditing`; otherwise when `dirty`, push `() => setConfirming(true)`; else push nothing. The dependencies are `[dirty, confirming, duplicate]` as today. Back while the duplicate prompt shows now closes it instead of leaving the form, and back again asks to discard (the form is dirty), as Cancel would. `src/app/App.tsx` stays unchanged.
  Alternatives: a second effect for the duplicate prompt (two entries could be pushed in the wrong order); keep today's fall-through (back silently drops a filled-in card). $0: none.

- **Keyboard.** Opening either dialog moves focus to a button, so the soft keyboard closes. Tests also check a 360 by 450 viewport (about the height left with the keyboard up) so the dialog fits even before the keyboard is gone. `.backdrop.center` centres inside whatever height the WebView has.
  Alternatives: keep focus in the field so the keyboard stays up (the dialog would share a short screen with it for no gain); anchor the dialog to the bottom (it would sit under the keyboard). $0: none.

## Overlap with `scan-back-chain` (PR #42, being reworked)

`scan-back-chain` also edits these files:

- `src/app/CardForm.tsx`: it adds `type PhotoSlotHandle` to the `./PhotoSlot` import, a `backSlot` ref on the line after `cancelButton` (right beside `keepEditing`, which this change rewrites), and `ref` / `onScanned` props on `PhotoSlot` inside `.photo-tiles`. Only the `cancelButton`/`keepEditing` hunk is close to this change. The prompts, the back-stack effect and the bar are not touched there.
- `src/app/card-form-actions.test.tsx`: both changes append tests at the end of the file, so the merge conflict there is "keep both".
- `docs/device-checklist.md`: both append a line, so keep both.
- `src/app/PhotoSlot.tsx`, `src/app/photo-slot.test.tsx` and `e2e/photos.spec.ts` are touched only by `scan-back-chain`. This change does not edit them. Its photo chooser is a `Sheet` with its own scrim, so it cannot be open together with a form prompt.

The implementation of this change rebases on `main` after `scan-back-chain` merges, and resolves the `CardForm.tsx` hunk by keeping `backSlot` next to the new `saveButton` ref.

## Risks / Trade-offs

- [The Delete dialog stays without `inert`, so the two dialogs differ in what TalkBack can reach behind them] → Accepted and out of scope. If the phone check shows TalkBack wandering behind the Delete dialog, that is a follow-up todo.
- [A drag on the scrim may scroll the form behind] → Harmless (fixed dialog, inert form). The phone check looks at it.
- [`flushSync` forces a synchronous render on a tap] → One small form re-render on a user action. No perf cost that matters.
- [Changing the duplicate prompt's role breaks locators] → `e2e/catalog.spec.ts` lines 152 and 163 and `card-form-actions.test.tsx` "back with the duplicate prompt open…" are updated in the task list.

## Migration Plan

None. The UI change ships with the next release build. Archive after the phone check.

## Open Questions

- Should the duplicate prompt focus Back to form (the safe choice, like Keep and Keep editing) instead of Increase quantity? This change keeps today's focus. Increase quantity is not destructive and is the usual answer.
- Should the Delete dialog get the same `inert` treatment later, so all three confirmations behave identically for TalkBack? This is not part of this change.
