## Context

See proposal.md for why. Today:

- `src/app/CardForm.tsx` renders `.actions` with Save (`button.primary`, `flex: 1` from `.actions .primary` in `src/app/app.css`) before Cancel. `onCancel` comes from `App.tsx` and switches the view at once. The form keeps `draft` (initialised by `toDraft(card)`), `photos` (newly captured only), `preparing` and `suggested` in state. A role=dialog duplicate prompt already renders inside the form; `CardDetail.tsx` and `SettingsScreen.tsx` use `role="alertdialog"` confirmations styled by the shared `[role="dialog"]:not(.sheet), [role="alertdialog"]` rule.
- Android back is handled in `App.tsx` `goBack`: it first calls the newest entry of `openSheets` (exported from `src/app/Sheet.tsx`; each `Sheet` pushes its `onClose` on mount), else moves up a screen. On the form it switches the view directly.
- The Sort sheet in `src/app/CollectionScreen.tsx` reuses `Sheet` with two `.group` blocks of `label.check` radio rows and no `foot`. `.sheet` is `height: 100%`; `.group h3` carries a rule plus `--space-5` top margin and `--space-4` padding (made for the long Filters sheet); `.check` adds `margin-bottom: --space-2`. The radios also match `input:not([type="checkbox"])`, the text-field rule (`width: 100%`, tinted background, ink underline, `min-height`), which is the likely cause of the misaligned rows.
- `src/app/BottomNav.tsx` wraps the plus in `span.nav-add`, styled in `app.css` as an ink-filled 40 by 24 frame with a ground-coloured 20 dp plus, next to 24 dp tab icons, so the frame is barely larger than they are.
- `#root` pads the bottom inset and the scrolling screens add it again, so the last control clears the system navigation bar, but the page scrolls under the transparent bar: nothing paints the inset area.

No other open change touches these requirements (`fix-top-players-ties` only touches the dashboard), so archive order does not matter.

## Goals / Non-Goals

**Goals:**
- Cancel left, Save right on both forms; a stray Cancel or back no longer loses entries.
- A Sort sheet sized to its content with aligned rows and a Done footer, behaviour unchanged.
- The Add frame is clearly larger than its neighbours.
- Content never shows behind the system navigation buttons.

**Non-Goals:**
- Undo, drafts, sort persistence, new sort fields, Filters sheet changes (see the proposal's Out of scope).

## Decisions

- **Button order by DOM order, not CSS.** Swap the two buttons in `.actions` so Cancel comes first; `.actions .primary { flex: 1 }` already makes Save take the rest of the row. Keyboard and TalkBack order then match the screen. Cancel keeps the existing ink-outlined default button style ("quiet" relative to the filled Save).
  Alternatives: `flex-direction: row-reverse` (screen and focus order disagree); a borderless text button for Cancel as in Material dialogs (breaks the existing app-theme rule that secondary buttons are ink-outlined; see Open Questions). $0: CSS and markup only.

- **"Holds entries" is a comparison, not a touched flag.** In `CardForm`, keep the opening draft (`const initial = useRef(draft)` or `useState(() => toDraft(card))[0]`) and compute `const dirty = photos.front || photos.back || preparing.front || preparing.back || (Object.keys(initial) as (keyof Draft)[]).some((k) => draft[k] !== initial[k])`. Every field is a string or boolean, so `!==` per key is exact. A suggestion applied by OCR or Claude changes `draft`, so it counts; a value typed and erased does not. Notes (written through `set`, not `edit`) counts too.
  Alternatives: the existing `touched` ref (misses suggestions and photos, and stays set after a value is typed back); `JSON.stringify` of the draft (same result, less obvious). $0: none.

- **Confirmation as an inline `role="alertdialog"` in the form, like Delete on the detail screen.** `const [confirming, setConfirming] = useState(false)`; Cancel calls `dirty ? setConfirming(true) : onCancel()`. The dialog, rendered after `.actions`, has `aria-label` "Discard this card?" (add) or "Discard changes?" (edit), a `<p>` with the same question, Keep editing (`autoFocus`, default ink-outlined, `setConfirming(false)`) and Discard (`className="danger"`, calls `onCancel`). `autoFocus` scrolls the dialog into view even when back was pressed at the top of a long form. `App.tsx`'s `onCancel` is unchanged, so "Cancel discards" (nothing stored, nothing queued) holds after Discard exactly as today.
  Alternatives: an undo snackbar after leaving (needs the draft and the captured photo blobs kept alive outside the unmounted form, plus a timer; more code for the same safety); disabling Cancel until the form is saved or emptied (traps the user); a modal `Sheet` (heavier than a two-button question; the inline alertdialog is the existing house pattern); `window.confirm` (native, unstyled, and blocks the WebView). $0: none.

- **Android back reuses the `openSheets` stack; no `App.tsx` change.** `CardForm` registers a back handler in `openSheets` while it needs one, the same way `Sheet` does: `useEffect(() => { if (!dirty && !confirming) return; const h = confirming ? () => setConfirming(false) : () => setConfirming(true); openSheets.push(h); return () => void openSheets.splice(openSheets.lastIndexOf(h), 1); }, [dirty, confirming])`. `goBack` already calls the newest entry before it moves screens, so back on a form with entries opens the confirmation, back again is Keep editing, and an untouched form still goes up a screen. This was the owner's "if feasible" case: it is feasible and in scope.
  Alternatives: a `canLeave` callback prop from `App` into `CardForm` (new plumbing for what the stack already does); handling it in `goBack` with a ref to the form's state (couples App to form internals). A rename of `openSheets` to a general back stack is left out (proposal). $0: none.

- **Sort sheet: a `compact` flag on `Sheet`, existing classes for the rows.** `Sheet` gains `compact?: boolean`, adding a `compact` class to `.sheet`; CSS `.sheet.compact { height: auto; max-height: 100%; }` so the backdrop's `align-items: flex-end` puts it at the bottom, sized to content, and a long sheet still scrolls inside `.sheet-body`. Inside it, `.compact .group h3` gets a smaller top margin and padding (`--space-2`, rule kept); `.check` keeps its `margin-bottom` for the 8 dp spacing between 48 dp touch targets, so the compact sheet tightens the headings only. Direction renders its two radios inside the existing `.pair` grid (two equal columns). The footer is `foot={<button className="primary" onClick={closeSort}>Done</button>}`, which `.sheet-foot .primary { flex: 1 }` already lays out like the Filters footer. Radios stop matching the text-field rule: the selector becomes `input:not([type="checkbox"]):not([type="radio"])` and `input[type="radio"]` joins the checkbox sizing rule (`--space-5` square, ink accent), so every radio sits in one column at the row's left edge. The e2e `CONTROLS` selector in `e2e/design.spec.ts` excludes radios like checkboxes (`label.check` is the target that counts).
  Alternatives: a separate `SortSheet` component (duplicates focus, back and Escape handling); a native segmented control or `<select>` for Direction (not a house component; radios keep the tested semantics); two columns for the four orders to get the sheet under half the screen (breaks the one-left-edge request); a `height` prop with numbers (no other caller needs it). $0: CSS only.
  Estimated height at 360 by 800 with no inset: about 12 padding + 48 head + 8 gap + (32 heading + 4 by 48 rows) + 12 gap + (32 heading + 48 row) + 8 gap + 60 foot + 16 padding, roughly 470 dp, which is why the spec's bound is two thirds of the screen rather than half (see Open Questions).

- **Add frame stays solid ink, grows by tokens.** `--size-nav-add-w` 40px to 48px, `--size-nav-add-h` 24px to 32px, `--size-nav-icon` 20px to 24px. The frame is then twice the icon width of the 24 dp neighbours and 8 dp taller; with its 4 dp gap and the label it still fits the 64 dp bar and the 48 dp target. The owner rejected an outlined frame on the phone, so `.nav-add` keeps its ink fill. `BottomNav.tsx` needs no change.
  Alternatives: only 44 by 28 (not clearly larger than a 24 dp icon cell); a bigger bar (moves every screen's bottom padding). $0: none.

- **System navigation bar strip: `body::after`, fixed, ground colour.** `body::after { content: ""; position: fixed; left: 0; right: 0; bottom: 0; height: var(--inset-bottom); background: var(--color-ground); pointer-events: none; z-index: 0 }`. The bottom bar has `z-index: 1`, so it paints over the strip and its own inset keeps the panel colour; sheets and dialogs sit above at `z-index: 10`. Pure CSS, no component, in both themes through the token. With a 0 inset the strip has no height. The existing screen padding already lets the last control scroll clear above it.
  Alternatives: a `<SystemBarScrim>` component (markup for a CSS job); colouring the Capacitor system bar (the plugin makes it transparent for edge-to-edge); padding `body` and dropping edge-to-edge (changes every screen). $0: none.

## Risks / Trade-offs

- [Existing e2e tests that cancel a filled form now meet the confirmation] → tasks list them: `e2e/catalog.spec.ts` "Serial above print run" and `e2e/photos.spec.ts` "Scanner closed without a photo" and "Cancel discards" add a Discard click; `e2e/catalog.spec.ts` "Missing required field" cancels an untouched form only if `fillCard(page, {})` types nothing (check it).
- [`openSheets` now also holds a form handler] → the handler is pushed and removed with the same `lastIndexOf` splice as `Sheet`, so a sheet opened over the form (none today) would still close first.
- [Sort sheet height bound is estimated, not measured] → the e2e scenario measures it; if fonts or tokens push it past two thirds, tighten the heading spacing, not the 48 dp rows.
- [The radio selector change touches every radio] → the Sort sheet holds the only radios today (grep `type="radio"`).

## Open Questions

- Cancel stays ink-outlined (the app-theme rule for secondary buttons); a borderless text button would be closer to stock Android. Owner to confirm on the phone check.
- The owner asked for "about half" the screen; one column of 48 dp rows plus two headings and a footer needs roughly 470 of 800 dp. The spec says under two thirds. If half is a hard wish, the order options would need two columns.
