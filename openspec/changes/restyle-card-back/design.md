## Context

See proposal.md for why. Today every colour, space, radius and size is a token in `src/app/tokens.css` (light in `:root`, dark in one `prefers-color-scheme: dark` block), and `src/app/app.css` gives every button, input, dialog and banner the pocket treatment (gradient, hairline edge, lit top edge). Text is Roboto/system sans, numbers are `ui-monospace`. `src/app/tokens.test.ts` checks that every colour role has both values, measures contrast with the pocket blended over the page, and fails on colour literals outside the token file. `e2e/design.spec.ts` checks touch targets, the nav pill (`.nav-indicator`), accent overrides and states at phone size. No font is bundled today.

The chosen look is recorded in the surface brief `.impeccable/surfaces/src-app.md` (git-ignored) and the two mocks `.impeccable/mocks/decision/retool-calm.html` (light) and `retool-night.html` (dark). The decision record below copies the brief's Direction contract so it survives in the repo.

### Decision record: Direction contract (owner's choice, 2026-11-10)

> THESIS: The collection looks like the back of a baseball card: calm cardboard, one ink, stat-line type. The category-default arrangement it refuses: the generic rounded-card Material dashboard, and the earlier loud "circus" cardboard (fanned cards, colour bars).
>
> OWN-WORLD: Light theme "Card-Back Calm": warm cardboard cream (#f3ecdc) ground, deep navy (#1c2b4a) as the only ink for text and rules, one red (#c8372d) held back for the baseball double-stitch seam (thin red dashed double rule under titles and between sections) and tiny flags (Rookie), gold (#f1c24a) only on the primary Add card button with navy text. Dark theme "Night Game": deep navy ground (#101a30), lighter navy panels (#17233f), cream text (#f3ecdc), the same stitch in a lifted red (#e0574b), same gold button. Photos always sit in true 2.5:3.5 trading-card frames (landscape photos in the rotated frame), rounded 6 px, thin keyline, inner print border. Numbers in a sturdy slab or condensed face with tabular figures; labels in small caps; secondary data in ruled stat tables with thin rules. Fonts ship inside the app.
>
> STORY: The owner glances and reads totals like a stat line, sees recent cards as real cards, and taps through to the list. It feels crafted and specific to baseball cards, never themed like a costume.
>
> FIRST VIEWPORT: Dashboard at phone width: title row (Dashboard, Synced label, gear) with red stitch rule below; six totals as a 2x3 ruled stat table (small-caps label, big slab number); Recently added as an even row of four trading-card frames with captions; Top teams as a ruled stat table; full-width gold Add card button; two-tab bottom nav with a red stitch underline on the active tab.
>
> FORM: Card-Back Calm, chosen after the owner's steer "feels like a circus; retool it to fit the baseball card theme".

## Goals / Non-Goals

**Goals:**
- One token file that holds both palettes, the two font families, the type scale, the stitch, the rules and the frame ratio; every screen styled from it.
- Fonts bundled, offline, licence free; no request leaves the app for them.
- AA contrast in both themes, checked by the unit test, not by eye.
- Keep every existing behaviour test green apart from the ones that assert the old look, which change with their requirement.

**Non-Goals:**
- Changing what any screen shows (the mock's Recently added captions "Hank Aaron 2025 Update" are not adopted; the caption stays the player name, on at most two lines then an ellipsis, by the owner's decision).
- A theme toggle, a third theme, texture images, motion.
- Replacing icons or the launcher icon and splash artwork.

## Decisions

### D1. Light maps to Card-Back Calm, dark to Night Game, and the phone decides
`prefers-color-scheme: light` (and no preference) shows Card-Back Calm; `prefers-color-scheme: dark` shows Night Game. The dark block in `tokens.css` overrides every colour role, as today, and `color-scheme: light dark` stays so native controls (date pickers, scrollbars, the select popup) follow. Switching the phone's setting while the app is open restyles it live, as the "Setting changes while running" scenario already requires. To keep "no white flash at launch", the Android window background before the WebView paints must match the ground: check `android/app/src/main/res/values/styles.xml` and the splash drawable, and add a `values-night` colour if the launch shows cream or white in dark.
- Alternatives: an in-app switch (rejected: the Phone Decides rule, and it is a feature nobody asked for); Night Game only (rejected: the owner chose both).
- $0: CSS only.

### D2. One layout and one type system for both themes; the themes swap colour only
Both themes use the Card-Back Calm layout and type: stacked stat cells (uppercase label above a 32 px slab number, 56 dp high), slab title, sans labels, gold button with sans 16 px label. Night Game differs only in colour roles plus the panel: stat tables, Top teams, sheets, dialogs and the bottom bar sit on `#17233f` with a 6 px radius, and rules are cream at 30 percent. The night mock's Oswald uppercase title, uppercase nav labels and inline 40 dp stat cells are not adopted.
- Alternatives: copy each mock exactly (rejected: a third font face, two layouts to test at 48 dp and 360 dp width, and screens that change shape when the phone switches theme).
- $0: no third font.

### D3. Token roles
`tokens.css` replaces `--color-page`, `--color-surface`, `--color-pocket*`, `--color-accent*`, `--color-ok` and `--type-mono` with:
- colour: `--color-ground`, `--color-panel`, `--color-ink`, `--color-ink-muted`, `--color-rule`, `--color-stitch`, `--color-gold`, `--color-on-gold`, `--color-danger`, `--color-frame`, `--color-scrim`, `--color-placeholder` (values in the app-theme spec table; scrim `#1c2b4a66` light, `#000000a6` dark; placeholder a flat tone of the ink at low strength, decided in the token file);
- font: `--font-slab: "Roboto Slab", Georgia, serif`, `--font-sans: Inter, system-ui, sans-serif`;
- size: `--type-label` 0.75rem (12, the owner's minimum label size), `--type-body` 0.875rem (14), `--type-table` 1.125rem (18), `--type-stat` 2rem (32, raised after review), `--type-title` 1.75rem (28), plus `--type-button` 1rem (16) for the gold button label as in the mock; rem so Android's text size setting scales them;
- shape: `--radius-print` 3px, `--radius-frame` 6px (frames, buttons, inputs, dark tables), `--radius-pill` for chips and the count badge; `--rule` 1px; `--stitch-line` 1.5px; `--stitch-gap` 5px; `--frame-ratio: 2.5 / 3.5`; `--gutter` 20px (mock page padding);
- the spacing scale, `--target-min` 48px and `--nav-height` 64px stay.
The sync state's idle dot and text use the ink (the mock shows an ink dot); error, paused and needs-decision keep the danger colour, and the wording already carries the meaning.
- Alternatives: keep the old role names and change the values (rejected: "pocket" and "accent" would mean something else and mislead the next reader).
- $0: CSS only.

### D4. Fonts: Roboto Slab and Inter from Fontsource packages, bundled by Vite
Add `@fontsource/roboto-slab` and `@fontsource/inter` and import only the weights used (slab 600 and 700, sans 400, 500 and 600) in `src/main.tsx` before `tokens.css`. Vite copies the woff2 files into `dist`, Capacitor serves them from the app's own origin, so nothing is fetched from the network. Fontsource's per-subset `unicode-range` means only the latin subset is read for normal names; accented names (Acuña) are in latin, and anything rarer falls back per glyph to the system face. The licence texts (Inter: SIL OFL 1.1; Roboto Slab: Apache 2.0, confirmed from the package's LICENSE) are copied to `public/licenses/` so they ship in the APK. `font-display: swap` (Fontsource default) keeps the first paint immediate.
- Alternatives: Google Fonts CDN as in the mocks (rejected: network at runtime, breaks offline); copying woff2 files into `src/assets` by hand (same result, but the version and licence trail are lost); system fonts only (rejected: Android has no slab face, and the stat-line character is the point); variable-font packages (one larger file per family; the static weights used are smaller in total).
- $0: free fonts, about 150 KB more in the APK.

### D5. The stitch is one CSS class
`.stitch` is an empty block with `border-top` and `border-bottom` of `var(--stitch-line) dashed var(--color-stitch)` and `height: var(--stitch-gap)`, `aria-hidden`. It sits under each screen title (the shared title row), between the dashboard sections, and as the active tab's `::after`. No image, no SVG.
- Alternatives: an SVG seam with V-shaped stitches (rejected: more code for a mark that reads at 5 px either way); a solid red rule (rejected: loses the baseball seam).
- $0: CSS only.

### D6. Trading-card frame wraps the existing thumbnail
`Thumb` (`src/app/Thumb.tsx`) wraps its image in `<span class="frame">` with `aspect-ratio: var(--frame-ratio)`, `--radius-frame`, a 1 px ink keyline, 3 px `--color-frame` padding and an inner 1 px rule on the image box. On the image's `load` it sets `data-orientation="landscape"` when `naturalWidth > naturalHeight`, which turns the frame to `3.5 / 2.5`; the image uses `object-fit: contain` so the whole photo shows. The list keeps its 67 dp square slot, so row height and text alignment do not change (portrait frame 48 x 67, landscape 67 x 48). Recently added uses the same component at column width; the detail strip (`CardDetail.tsx` photo buttons) and form slots (`PhotoSlot.tsx`) use the frame class on their images.
- Alternatives: crop photos to 2.5:3.5 (rejected: the spec forbids cropping); a frame image (rejected: raster to maintain, two themes).
- $0: CSS and a few lines of TSX.

### D7. Stat tables keep one button per cell
The dashboard's six tiles stay six `<button>`s with their accessible names; the grid container draws the outer rule and the cells draw inner rules (right on the first column, bottom on all but the last row), with no gap, so the table reads as one ruled block. Top teams rows are buttons with a bottom rule. The Rookies flag is a `::after` on the Rookies cell (a small clipped pennant in the stitch colour), so it never reaches the accessible name. The dashboard's computation and memoisation are untouched, so the 1 s budget for 5,000 cards holds.
- Alternatives: a real `<table>` (rejected: cells must be buttons, and table semantics would add row and column announcements nobody asked for).
- $0.

### D8. Gold marks the one primary action of a screen; ink does the rest
`button.primary` is gold with on-gold text: Add card on the dashboard and list, Save on the form, Show cards in the filter sheet, Edit on detail. Chips and the filter count badge become ink fill with ground text; the serial tag becomes an ink-outlined stamp in the slab face; links are ink and underlined; the focus ring is 2 px ink. Default buttons are transparent with a 1 px ink border.
- Alternatives: gold only on Add card as the brief literally says (rejected for now: Save and Show cards would then look like Cancel and Clear all next to them; see Open questions); gold chips as today (rejected: gold would stop meaning "the action").
- $0.

### D9. Tests first, adapted rather than duplicated
`tokens.test.ts` gets the new role list, the contrast pairs from the spec (ground, panel, gold; stitch and keyline at 3:1), a font-family literal scan and a scale check. `e2e/design.spec.ts` changes the nav test from `.nav-indicator` to the stitch underline, the accent-override tests to gold and ink overrides, and adds frame-ratio, no-pocket-surface and no-network-font tests (Playwright `page.route` aborting every non-app origin and recording font requests). `e2e/dashboard.spec.ts` gets the ruled-table and frames checks. Existing behaviour tests stay as they are.
- $0.

## Risks / Trade-offs

- [Cream ground and a slab face are a common vintage default; the app could read as a costume] → keep red rare (stitch and Rookies flag only, checked by the "Red stays rare" scenario), one ink, a strict grid: one `--gutter` on every screen, rules 1 px and aligned to the same column edges, no ornaments, badges or textures beyond the spec.
- [12 px small-caps labels may be small for a glance at arm's length] → AA contrast holds, sizes are rem so the phone's text size setting scales them; the phone review (5.x) checks it, and a change would be a token value.
- [Dark rules at 30 percent cream are below 3:1] → they are decorative; every cell is identified by its text and the cells are buttons with names. Keylines and the stitch, which carry meaning, are held to 3:1.
- [Fonts arrive after first paint and the layout shifts] → local files load in milliseconds; fixed row and cell heights do not depend on the face; the perf tests still guard the 1 s budget.
- [Dashed borders render differently across WebView versions and pixel densities] → phone check in light and dark.
- [APK grows by the font files] → static weights only, about 150 KB.
- [Many e2e assertions name `.nav-indicator`, `--color-accent` and pocket tokens] → they change in task group 1 together with their requirements, before the CSS.

## Migration Plan

One branch, no data change. Tokens and fonts land first, then screens one by one, each with its tests green. Rollback is reverting the merge; nothing on the device or in Drive depends on the look.

## Update after the owner's phone review

Supersedes D3, D5 and D8 where they differ: the stitch (D5) is removed with `--color-stitch`, `--stitch-line` and `--stitch-gap`, and the Rookies flag keeps its red as `--color-flag`; sections are separated by whitespace and a single 1 px `--color-rule` line under titles only; the active tab has no underline. The primary action (D8) is ink-filled with ground-coloured text, so `--color-gold` and `--color-on-gold` are removed. Spacing is opened up by tokens: `--gutter` 24, `--gap-section` 32, `--gap-field` 24, `--gap-label` 8, `--pad-cell` 16, `--pad-row` 16, `--gap-frame` 12, `--gap-caption` 8. List rows stay 100 dp.

## Open Questions

- Gold on every primary action (D8) or only on Add card? Recorded as the assumption above; the owner can confirm at the phone review. Changing it touches CSS and one scenario.
- Night Game's Oswald uppercase title and inline stat cells (D2): not adopted. If the owner wants them, that is a follow-up change (a third face).
- The bottom navigation keeps its icons although the mocks show labels only, because the app-shell requirement keeps an icon on each destination.
- Roboto Slab's licence (OFL 1.1 or Apache 2.0) is confirmed from the installed package at task 2.2; both are free and allow bundling.
