---
name: The Binder
description: Nine-Pocket Binder, a trading-card collection app where every control is a see-through pocket on a flat page.
colors:
  page: "#f4f5f7"
  surface: "#ffffff"
  pocket: "#e4e8f0cc"
  pocket-edge: "#14161a1f"
  scrim: "#14161a66"
  text: "#14161a"
  text-muted: "#4a5160"
  accent: "#f1c24a"
  on-accent: "#14161a"
  accent-text: "#7a5200"
  ok: "#17703d"
  danger: "#b3261e"
  dark-page: "#101114"
  dark-surface: "#17181c"
  dark-pocket-top: "#ffffff14"
  dark-pocket: "#ffffff08"
  dark-pocket-edge: "#ffffff21"
  dark-scrim: "#000000a6"
  dark-text: "#eceff4"
  dark-text-muted: "#aab3c2"
  dark-on-accent: "#101114"
  dark-ok: "#7ee0a0"
  dark-danger: "#ff8a80"
typography:
  title:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1.375rem"
    lineHeight: 1.2
  body:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.3
  label:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
  mono:
    fontFamily: "ui-monospace, monospace"
    fontSize: "0.875rem"
rounded:
  s: "4px"
  m: "10px"
  l: "16px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "40px"
  "8": "48px"
components:
  button:
    backgroundColor: "{colors.pocket}"
    textColor: "{colors.text}"
    rounded: "{rounded.m}"
    padding: "0 16px"
    height: "48px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.m}"
    padding: "0 16px"
    height: "48px"
  stat-tile:
    backgroundColor: "{colors.pocket}"
    textColor: "{colors.text}"
    rounded: "{rounded.m}"
    padding: "12px"
  chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.l}"
    height: "48px"
  tag:
    textColor: "{colors.accent-text}"
    rounded: "{rounded.s}"
    padding: "0 4px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.l}"
    padding: "12px"
  input:
    backgroundColor: "{colors.pocket}"
    textColor: "{colors.text}"
    rounded: "{rounded.m}"
    padding: "8px 12px"
    height: "48px"
---

# Design System: The Binder

Recorded from `src/app/tokens.css` and `src/app/app.css` as shipped. The frontmatter is normative; `target-min` (48px) and the scrim/pocket-top roles are described below because they have no frontmatter group.

## Overview

**Creative North Star: "The Nine-Pocket Binder"**

A card binder page: a flat, quiet page with see-through pockets holding things. Every interactive surface (button, input, select, summary, dialog, banner, zoom frame) is a pocket: a translucent gradient, a hairline edge and a lit top edge. Nothing floats on shadows or blurs. The one loud voice is a warm card-sleeve yellow accent, used for the primary action, filter chips and counts.

The phone owns the theme. Light and dark both ship and follow `prefers-color-scheme`; there is no in-app toggle. Density is thumb-first: 48px targets, 12px page gutters, one bottom-anchored add button on each screen that adds cards (the dashboard and the list).

**Key Characteristics:**
- Pocket treatment on all controls, flat page behind them.
- One accent (yellow), one text-safe accent variant for small text.
- Bottom sheets (not centered modals) for add and filter flows.
- Roboto/system sans, with mono reserved for data (counts, numbers, tags, sync line).
- Every value is a token in `tokens.css`.

## Colors

A cool grey-blue neutral page with translucent pockets and a single warm yellow accent; status colours are muted green and red, brightened in dark.

### Primary
- **Sleeve Yellow** (accent #f1c24a, same in both schemes): primary button fill, chip fill, count badge, checkbox accent, focus-adjacent emphasis. Always paired with **Ink on Yellow** (on-accent: #14161a light, #101114 dark).
- **Deep Amber** (accent-text #7a5200 light; in dark it resolves to the accent yellow): the accent when used as text or outline on the page: links in banners, tag text and border, focus ring. Yellow itself fails contrast as small text on light, so never use accent for text in light.

### Neutral
- **Binder Page** (page #f4f5f7 / dark #101114): app background.
- **Sheet Paper** (surface #ffffff / dark #17181c): bottom sheets, list scroller, dialogs, zoom frame. Opaque, so content never shows through.
- **Pocket** (pocket #e4e8f0cc / dark #ffffff08): bottom stop of the pocket gradient and thumbnail placeholder. Light mode pocket-top equals pocket (flat); dark mode pocket-top is #ffffff14, giving the lit top edge.
- **Pocket Edge** (pocket-edge #14161a1f / dark #ffffff21): 1px pocket border, dashed empty-state border, danger-zone divider.
- **Ink** (text #14161a / dark #eceff4) and **Muted Ink** (text-muted #4a5160 / dark #aab3c2): body and secondary text, placeholders, hints.
- **Scrim** (scrim #14161a66 / dark #000000a6): the sheet backdrop only.

### Status
- **Ok** (#17703d / dark #7ee0a0): sync idle.
- **Danger** (#b3261e / dark #ff8a80): errors, invalid fields, danger buttons, sync error/paused/needs-decision.

### Named Rules
**The Tokens Only Rule.** No colour literal is written outside `tokens.css`. Components reference `var(--color-*)`; a new colour is a new token with a light and a dark value.

**The Text-Safe Accent Rule.** Yellow is a fill. When the accent must read as text or a line on the page, use `--color-accent-text`.

**The Phone Decides Rule.** Theme follows `prefers-color-scheme` only. Every colour token that differs in dark is overridden in the one dark block; there is no manual theme switch.

## Typography

**Body/Title Font:** Roboto, falling back to system-ui, sans-serif.
**Mono Font:** ui-monospace, monospace (data only).

**Character:** Plain Android-native sans, with monospace giving counts and numbers a ledger feel.

### Hierarchy
- **Title** (400/default, 1.375rem, 1.2): h1 and h2 screen and sheet titles.
- **Body** (400, 1rem, 1.3): default text, inputs, buttons, the player name in list rows (weight 500).
- **Label** (500 where emphasised, 0.875rem): meta lines, hints, errors, group headings (muted), badge, tag, secondary row text.
- **Mono** (0.875rem): item count line, "shown" line, card number, tag, sync-adjacent meta.

### Named Rules
**The Three Sizes Rule.** Only title, body and label sizes exist. A new size is a new token.

## Layout

Single column, full-bleed phone layout. Page gutter is 12px (space-3); the list screen uses 8px vertical, 12px horizontal. Rhythm runs on the 4px scale (space-1 4, 2 8, 3 12, 4 16, 5 24, 6 32, 7 40, 8 48). Gaps between related controls are 8px; between groups 12px; danger zone separated by 32px.

The app draws under the system bars: `#root` and scrolling screens add safe-area insets (Capacitor `--safe-area-*` vars, `env()` fallback). A fixed add button spans the width at the bottom (inset + 16px) and the list scroller reserves target-min + 16px beneath it. The list is virtualised with absolutely positioned rows; each row is a full-width pocket button with a 48x67px thumbnail (card ratio), text column and optional tag.

Hit targets: `--target-min` is 48px; every button, summary, banner link, input and checkbox row meets it (checkbox glyph itself is 24px inside a 48px row).

### Named Rules
**The 48 Rule.** Anything tappable is at least 48px (`--target-min`) in height and width, visually or through its row.

## Elevation & Depth

Flat. Depth comes from tone and hairlines, not shadows or blur. The pocket carries a 1px edge and an inset 1px top highlight (`box-shadow: inset 0 1px 0 var(--color-pocket-top)`), which is a lit edge, not an elevation. Overlays are separated by the scrim and an opaque surface. Primary buttons and chips drop the inset highlight.

### Named Rules
**The Cheap Effects Rule.** No blur, backdrop-filter, drop shadow or animation-heavy effect; pressed state is a plain opacity change (0.8), disabled is 0.5. The device is a phone running a long virtualised list.

## Shapes

Three radii: small 4px (thumbnails, tags), medium 10px (the pocket: buttons, inputs, dialogs, banners, empty state), large 16px (chips, count badge, list scroller, sheet top corners). Sheets round only their top corners and drop the bottom and side borders. Count badge and sync dot are fully round. Borders are always 1px (focus ring 2px with 2px offset); the empty state uses a dashed pocket edge.

## Components

### Buttons
- **Shape:** pocket, 10px radius, min 48x48, 16px horizontal padding, centred label.
- **Default:** pocket gradient, hairline edge, Ink text.
- **Primary:** flat Sleeve Yellow fill and border, Ink on Yellow text, weight 500, no inset highlight. One per sheet/screen footer; in a row it takes the remaining width.
- **Danger:** default pocket with Danger text.
- **States:** active drops opacity to 0.8; disabled 0.5; focus-visible 2px Deep Amber outline, 2px offset.
- **Add button:** primary, fixed to the bottom with 12px side margins; the one entry point for adding on its screen. The dashboard and the list each have exactly one, the same component and sheet.

### Stat tile
A pocket button on the dashboard, in a two-column grid with 8px gaps, at least 48px high (80px). The label sits on top in muted label-size text, the number below it in the mono face at title size in Ink; both are readable text, not an icon. Never accent-filled (the accent stays on the one primary action and on chips). Tapping opens the list filtered to what the tile counts. The accessible name is "label, number".

### Chips
Removable filter chips: Sleeve Yellow fill, Ink text, weight 500, 16px radius, 48px min height. A trailing close mark follows the label (see Do's and Don'ts). One chip per active filter, wrapping with 8px gaps. Tapping removes the filter.

### Tag
Mono label-size, weight 500, Deep Amber text with a 1px Deep Amber outline, 4px radius, 4px horizontal padding, sits at the right end of the player line in a list row and beside the title on the detail screen. Outline only, never filled.

### Sheets
Bottom sheets over a scrim backdrop (z-index 10, aligned to the bottom, top inset respected). Opaque Sheet Paper, 16px top corners, 12px top and side padding, 16px plus the bottom inset below (same clearance as the add button), 8px gap. Structure: head (title plus close, space-between), body (scrolls, flex 1), foot (actions, primary takes the width). `.sheet.full` takes full height (filter sheet); the add sheet is content height. Group headings inside are muted label-size, weight 500.

### Inputs / Fields
Pocket gradient, 10px radius, full width, min 48px, 8px by 12px padding; textarea min 96px. Placeholder in Muted Ink. Invalid input shows a Danger border with a Danger label-size message. Required note is muted label. Checkbox is 24px with accent colour in a 48px row. Search label is visually hidden but present.

### List row
Full-width pocket button, 12px padding and gap, 48x67 thumbnail (4px radius, pocket placeholder, cover fit). Two lines, row height 100px: the player name (body size, weight 500, single-line ellipsis) with the Tag as a badge at the right end of the same line, and one quiet muted label-size line "year set · #number" (number mono) continuing with parallel, grade and quantity as plain text. The line never wraps: the extras shrink first, then the set, never the number.

### Card facts
Detail screen, top to bottom: the player as a large title (title size, weight 500) with the Tag badge beside it, a muted label-size subtitle "year set · #number", `dl.facts`, a plain list with 1px pocket-edge dividers (no box): muted label-size label at the left, body-size value right-aligned, 12px row padding, rows only for what the card has; then a strip of pocket photo thumbnails. Last edited is a muted line below that, Edit is the full-width primary button, Delete sits apart below a divider in the danger zone.

### Banner and status
Pocket banner with 4px by 12px padding; link text Deep Amber underlined, no pocket styling. Sync status is a coloured dot plus text: Ok when idle, Danger on error/paused/needs-decision. Empty state is a dashed pocket-edge box with muted text.

### Navigation
The dashboard is home: Android's back button closes the app from there. The list has a Back button in its header that returns to the dashboard, and so does the Android back button. The detail and settings screens have no on-screen Back button: Android's back button and gesture return to where they were opened from (the list for detail, the dashboard or the list for settings). Forms keep Cancel and sheets keep Close.

### Photos
Detail screen shows thumbnails (56x78 slot images, 4px radius; 96px-high thumb buttons) that open a full 60vh zoom pocket with contained image.

## Do's and Don'ts

### Do:
- **Do** write every colour, space, radius and type size as a token; add a light and a dark value for any new colour in `tokens.css`.
- **Do** give every tappable element at least 48px (`--target-min`).
- **Do** use Deep Amber (`--color-accent-text`) for accent-coloured text or outlines on the page.
- **Do** build new controls as pockets (gradient, 1px edge, inset top highlight, 10px radius) and new flows as bottom sheets.
- **Do** keep the effects cheap: opacity for press, scrim plus opaque surface for overlays.
- **Do** let the phone pick light or dark.

### Don't:
- **Don't** write colour literals (hex, rgb, hsl) outside `tokens.css`.
- **Don't** add blur, backdrop-filter or drop shadows; the inset lit edge is the only box-shadow.
- **Don't** add an in-app theme toggle.
- **Don't** use yellow as small text on the light page.
- **Don't** add a second add button to a screen, or a centered modal where a sheet fits.

### Not canonized (defects the build carries)
- The chip close mark is a text glyph (`content: "\00d7"` in `.chip::after`), a glyph icon; future surfaces should use a proper icon, not copy it.
- Sizes outside the token scales (thumbnails 48x67 / 56x78, 96px thumb and textarea, 60vh zoom, 1.3 and 1.2 line-heights) are one-off literals in `app.css`, not system tokens.
