## Context

Capacitor 8 on Android 16 (target SDK 36) draws edge to edge, so the WebView runs under the status and navigation bars. `index.html` already sets `viewport-fit=cover`, and Capacitor's built-in SystemBars plugin writes `--safe-area-inset-*` CSS variables. Navigation is a `view` state in `App.tsx`, not a browser history, so the WebView has nothing to go back to. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Every control reachable on a gesture-navigation phone.
- Back button behaves per `app-shell`.
- A refused save is visible from where the Save button is.

**Non-Goals:**
- Theming, colours, layout redesign (own change).
- An in-app camera or rear-lens control (own change).
- Changing which fields the schema requires.

## Decisions

**D1. Insets in CSS, read from the SystemBars variables with `env()` as fallback.** `#root` carries the four insets as padding, and scrolling screens (`form`, `section`) add the bottom inset to their own padding, because padding on a fixed-height root does not extend a scroll area. The two sources are combined with `max()` so a phone that supplies both is not padded twice.
- Alternatives: a native `windowOptOutEdgeToEdgeEnforcement` style (works on Android 15 only, removed in later targets); Capacitor `SystemBars` with `insetsHandling: "margin"` (also shifts the WebView, hides the colour behind the bars); the `@capacitor/status-bar` plugin (another dependency for one overlay flag).
- Keeps $0: CSS only.

**D2. One `backButton` listener in `App.tsx`, from `@capacitor/app` (already installed).** It reads the current view: list exits the app, edit-form returns to its card's detail, everything else returns to the list. The listener is re-registered when the view changes, so it never acts on a stale view.
- Alternatives: pushing a `history` entry per screen (a router for four screens, and exit behaviour still needs the plugin); handling it natively in `MainActivity` (cannot see the view state).
- Keeps $0: no new dependency.

**D3. Required marking and the blocked-save message live in `Field` and `CardForm`, not the schema.** `Field` gets a `required` prop that adds visible text ("required"), not just a colour. `CardForm` already holds the validation result; on a refused save it focuses the first invalid input (the browser scrolls it into view, so the user lands on a field with its error showing) and renders a summary next to the Save button naming all the fields. On a long form the summary is therefore off-screen right after the jump; the user chose the jump over keeping the summary in view. The schema is the single list of required fields; the form derives the marks from it so the two cannot drift.
- Alternatives: native HTML `required` attributes (the form is `noValidate` on purpose, and Android's bubble is poor); a toast (disappears, not tied to the fields).
- Keeps $0: no new dependency.

**D4. The `card-photos` scenario is corrected in the foundation change's own spec file, not by a delta.** `openspec/specs/` is empty until the foundation change is archived, so there is nothing to modify yet; editing the unarchived scenario keeps the eventual archive coherent.
- Alternative: leave the dead scenario and its dead `PermissionDeniedError` path (`ScanFlow`, `PhotoSlot`): rejected for the scenario, but the code path is left in place here because removing it is a separate cleanup.

## Risks / Trade-offs

- [Inset variables arrive after first paint on some phones] → the `env()` fallback and the `0px` default give a correct first frame on gesture-navigation phones; verify on the device after a cold start.
- [`max()` hides a real double inset if a phone supplies different values] → accepted; the larger value is the safe one.
- [Bottom inset is added both by `#root` and by `form`/`section` on non-scrolling screens] → slightly more space at the bottom; accepted over a per-screen rule.
- [Back handler lets the user lose an unsaved form] → same as the Cancel button today; a discard prompt is a separate decision.
