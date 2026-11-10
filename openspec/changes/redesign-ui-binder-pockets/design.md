## Context

`src/app/app.css` is 34 lines with 7 colour literals; screens use browser-default controls. `index.html` already sets `viewport-fit=cover` and `#root` carries the safe-area insets (fix-android-shell). The owner chose the "Nine-Pocket Binder" look from sketches on 2026-11-09: dark-first, light and dark follow the phone, list-first (find a card fast), and nothing that looks like a generic template, is busy or decorative, or feels corporate. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- One token file as the only source of colour, type, spacing, radius and target size.
- Dark and light themes that follow Android, both designed.
- A list that stays fast at 5,000 cards (the existing 1 s first-screen test must keep passing).

**Non-Goals:**
- A token build pipeline, Material Web components, an icon set, an in-app theme switch, or any behaviour change.

## Decisions

**D1. Tokens are CSS custom properties in `src/app/tokens.css`, semantic names, no build step.** Roles: `--color-page`, `--color-surface`, `--color-pocket`, `--color-pocket-edge`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-on-accent`, `--color-accent-text`, `--color-ok`, `--color-danger`; `--space-1..8` (multiples of 4 dp, the 8 dp rhythm); `--radius-s/m/l`; `--type-title/body/label/mono`; `--target-min: 48px`. The dark values live in `@media (prefers-color-scheme: dark)`, the light values in `:root`.
- Alternatives: Style Dictionary or a token pipeline (a build tool and a second source of truth for one app); Tailwind (a dependency and utility-class churn across every component); CSS-in-JS (runtime cost on a 5,000-row list); Material Web components (heavy, and they impose the category-standard look the owner declined).
- Keeps $0: plain CSS.

**D2. The theme follows the system through `prefers-color-scheme`.** The Capacitor Android theme is a DayNight theme, so the WebView reports the phone's setting; verified on the phone in task 4.1 by toggling `cmd uimode night`.
- Alternatives: a manual in-app switch (an extra setting to build and remember; the owner asked for "follow the phone").

**D3. The look.** Dark: page `#101114`, binder page `#17181c`, pocket gradient from white at 8% to 3% with a 1 px edge at 13% and a lit top edge, text `#eceff4`, muted `#aab3c2`, accent gold `#f1c24a` (on-accent `#101114`), ok `#7ee0a0`, danger `#ff8a80`. Light is designed separately: page `#f4f5f7`, binder page `#ffffff`, pocket a cool-grey fill with a 1 px edge, text `#14161a`, muted `#4a5160`, accent fill `#f1c24a` with `#14161a` on it, and a deeper amber `#7a5200` for accent text and tags so gold text meets 4.5 to 1 on white, ok `#1b7f46`, danger `#b3261e`. Final values are fixed by the contrast test (task 1.1), which wins over these numbers.
- Type is Roboto for text and a monospace face for serials, counts and numbers, both system fonts, so nothing downloads.
- Alternatives: the zoo-map, Crouwel-grid and graphite-console looks (set aside by the owner's pick); the Material 3 standard look (offered as the standing exit and not chosen).

**D4. Pocket effects stay cheap.** The pocket is a gradient background, a 1 px border and an inset highlight; no blur, no `backdrop-filter`, no large shadows, and no per-row images beyond the existing thumbnails, so scrolling 5,000 virtualised rows is not slowed. Task 2.3 re-runs the throttled performance test.

**D5. Structure changes are minimal.** Screens gain class names and the few wrapper elements the layout needs; no component logic, state or port changes. The `fix-android-shell` safe-area padding is kept and expressed through tokens where it needs numbers.

**D6. Rules are enforced by tests, not review alone.** A Vitest test scans `src/` styles and components for colour literals outside the token file; another parses the token file and checks the contrast ratios of both themes; a Playwright check at a 360 by 800 phone viewport measures target sizes.

## Risks / Trade-offs

- [The WebView may not report the phone's dark mode] → verified on the phone in task 4.1; if it does not, set the Android theme to follow the system or pass the setting in from the native side.
- [Gold on white fails contrast] → the light theme uses a deeper amber for text and the gold only as a fill with dark text; the contrast test enforces it.
- [Pocket rows cost frame time at 5,000 cards] → D4 and the existing performance test.
- [A pretty sketch hides real states] → the sketch is only the first viewport; empty, sync-paused, offline, error and validation states are designed during the build and reviewed in the finish review.
- [Dark-first is the familiar choice for collectors] → accepted by the owner's choice; the light theme gets its own review.

## Open Questions

- Whether the card detail screen shows photos as a large pocket or a plain image. It does not change the specs; decided during task 3.1 against the finish review.
