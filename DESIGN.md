---
name: The Binder
description: A baseball-card collection app that looks like the back of a card, calm cream cardboard (Card-Back Calm) or night navy (Night Game), one ink, stat-line type, open spacing and no decorative colour.
colors:
  ground: "#f3ecdc"
  panel: "#f3ecdc"
  ink: "#1c2b4a"
  ink-muted: "#4a5670"
  rule: "#1c2b4a8c"
  danger: "#a82a22"
  frame: "#f3ecdc"
  scrim: "#1c2b4a66"
  placeholder: "#d8d1bf"
  night-ground: "#101a30"
  night-panel: "#17233f"
  night-ink: "#f3ecdc"
  night-ink-muted: "#c2bcae"
  night-rule: "#f3ecdc4d"
  night-danger: "#ff8a80"
  night-frame: "#f3ecdc"
  night-scrim: "#000000a6"
  night-placeholder: "#2a3756"
typography:
  title:
    fontFamily: "Roboto Slab, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.1
  stat:
    fontFamily: "Roboto Slab, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
  table:
    fontFamily: "Roboto Slab, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.1
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.3
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  tag:
    fontFamily: "Roboto Slab, Georgia, serif"
    fontSize: "0.75rem"
    fontWeight: 600
rounded:
  print: "3px"
  frame: "6px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "40px"
  "8": "48px"
  gutter: "24px"
  gap-section: "32px"
  gap-field: "24px"
  gap-label: "8px"
  pad-cell: "16px"
  pad-row: "16px"
  gap-frame: "12px"
  gap-caption: "8px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.frame}"
    padding: "0 16px"
    height: "48px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.button}"
    rounded: "{rounded.frame}"
    padding: "0 16px"
    height: "48px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.frame}"
    height: "48px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    width: "48px"
    height: "48px"
  stat-table:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
  stat-tile:
    textColor: "{colors.ink}"
    typography: "{typography.stat}"
    padding: "0 8px"
    height: "48px"
  chip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    height: "48px"
  badge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 4px"
  tag:
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.print}"
    padding: "0 6px"
  frame:
    backgroundColor: "{colors.frame}"
    rounded: "{rounded.frame}"
    padding: "3px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "8px 12px"
    height: "48px"
  sheet:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    padding: "12px 20px"
  bottom-nav:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-muted}"
    height: "64px"
  nav-add:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.frame}"
    width: "48px"
    height: "32px"
---

# Design System: The Binder

Recorded from `src/app/tokens.css`, `app.css`, `fonts.css` and the components as shipped. The frontmatter is normative. Colors prefixed `night-` are the dark theme's values for the same roles (`--color-<role>` in the `prefers-color-scheme: dark` block); the sidecar `.impeccable/design.json` carries tonal ramps, the press-state note and component snippets.

## Overview

**Creative North Star: "The Back of the Card"**

The collection looks like the back of a baseball card: calm cardboard, one ink, stat-line type. Light is **Card-Back Calm**, a warm cream cardboard ground with deep navy as the only ink for text, rules and borders. Dark is **Night Game**, a deep navy ground with lighter navy panels and cream text. Two things carry the world: photos that always sit in true 2.5:3.5 trading-card frames, and stat-line numbers in a slab face. Everything else is quiet and open: whitespace between sections, hairline navy rules, ruled tables of numbers, ink-filled primary buttons and outlined secondary ones.

The phone owns the theme. Light and dark both ship and follow `prefers-color-scheme`; there is no in-app toggle. Density is thumb-first: 48px targets, 24px page gutters, 32px between sections, Add card is the middle item of the bottom navigation on each top-level screen.

**Key Characteristics:**
- One ink (navy in light, cream in dark); rules and borders are that ink, thinned.
- No decorative red; the only red is the danger text colour; the primary button is ink-filled.
- Numbers in Roboto Slab with tabular figures; labels in uppercase 12 px Inter; body in Inter.
- Secondary data in ruled stat tables, not boxed cards.
- Fonts ship inside the app (woff2 under `fonts.css`), so nothing loads from the network.
- Every colour and font face is a token in `tokens.css`.

## Colors

A cream-and-navy neutral world. Status is a single danger red.

### Primary
- **Ink Fill** (ink #1c2b4a light, #f3ecdc dark): the primary button fill (Save, Edit, Show cards in the sheet, Sign in with Google) and the Add frame in the bottom navigation, always with ground-coloured text (cream on navy in light, navy on cream in dark). There is no gold. On the card form Cancel (ink-outlined) sits left of Save, which takes the rest of the row.

### Neutral
- **Cardboard Cream** (ground #f3ecdc / night-ground #101a30): app background.
- **Panel** (panel #f3ecdc / night-panel #17233f): stat tables, sheets, dialogs, banners, bottom nav, zoom view. In light it equals the ground; in dark it is one step lighter navy.
- **Card Ink** (ink #1c2b4a / night-ink #f3ecdc): all text, borders, chips, badge fill and the focus ring.
- **Muted Ink** (ink-muted #4a5670 / night-ink-muted #c2bcae): labels, placeholders, hints, inactive nav, secondary row text.
- **Keyline** (rule #1c2b4a8c / night-rule #f3ecdc4d): thin rules between table cells, list rows, facts, sheet edges and the divider above Sign out in settings.
- **Frame Stock** (frame #f3ecdc, both themes): the matte of a photo frame.
- **Print Placeholder** (placeholder #d8d1bf / night-placeholder #2a3756): the empty photo area and the keyline round a photo.
- **Scrim** (scrim #1c2b4a66 / night-scrim #000000a6): the sheet backdrop only.

### Status
- **Danger** (danger #a82a22 / night-danger #ff8a80): errors, invalid field underline, delete, sync error / paused / needs-decision. Sync idle is plain ink; there is no green.

### Named Rules
**The Tokens Only Rule.** No colour literal is written outside `tokens.css`. Components reference `var(--color-*)`; a new colour is a new token with a light and a dark value.

**The One Ink Rule.** Text, rules and borders are ink at full or thinned strength. 

**The No Decorative Red Rule.** The only red is the danger colour, used for error text, the sync problem text, Delete and Sign out. Do not use it for buttons, links, badges, flags or emphasis.

**The Phone Decides Rule.** Theme follows `prefers-color-scheme` only. Every token that differs in dark is overridden in the one dark block.

## Typography

**Display / Numbers Font:** Roboto Slab (700, 600 for the tag), falling back to Georgia, serif.
**Body / Label Font:** Inter (400, 500, 600), falling back to system-ui, sans-serif.

**Character:** A sturdy slab for headings and figures, like the numerals on a card back, with a plain sans for everything read in running text. `font-variant-numeric: tabular-nums` is set on the body so columns of numbers align.

### Hierarchy
- **Title** (Slab 700, 1.75rem, 1.1): h1 and h2 screen titles and form titles.
- **Stat** (Slab 700, 2rem, 1): the number on each stat tile.
- **Table** (Slab 700, 1.125rem, 1.1): group headings (Recently added, Top teams, filter groups), sheet titles, team counts, chip close mark.
- **Button** (Inter 600, 1rem): primary button label.
- **Body** (Inter 400, 0.875rem, 1.3): default text, inputs, buttons (weight 500), the player name in rows (500), sync detail.
- **Label** (Inter 600, 0.75rem, uppercase, 0.08em tracking): tile labels, field labels, fact labels, the "shown" line, sync status. Hints, errors, the required note, badge and tag use the same 0.75rem size without the uppercase transform.

### Named Rules
**The Six Sizes Rule.** Only label, body, button, table, stat and title sizes exist, each a `--type-*` token. A new size is a new token.

**The Slab Is For Numbers And Headings Rule.** Slab sets titles, stat numbers, counts and the serial tag; Inter sets everything else.

## Layout

Single column, full-bleed phone layout with a 24px gutter (`--gutter`). Rhythm runs on the 4px scale plus named tokens: `--gap-section` 32 between sections, `--gap-field` 24 between form fields, `--gap-label` 8 from a label to its field, `--pad-cell` 16 inside stat cells, team rows and fact rows, `--pad-row` 16 between a list thumbnail and its text (list rows are padded 0 0 8px so they stay 112px), `--gap-frame` 12 between Recently added frames, `--gap-caption` 8 from frame to caption. Related controls sit 8px apart; the danger zone is separated by 32px plus a keyline.

The app draws under the system bars: `#root` and scrolling screens add the safe-area insets (Capacitor `--safe-area-*` variables, `env()` fallback). The bottom navigation is fixed to the bottom edge (64px plus the inset). Add card is the middle item of that bar, so there is no separate button or band; the list scroller and the dashboard reserve the room beneath so their last row clears the bar. Where there is no bottom navigation (form, detail, Settings) a fixed, touch-through strip of the bottom-inset height in the ground colour (`body::after`) sits under the system navigation buttons so scrolled content never shows behind them; the bottom bar paints over it.

Headers are one row at a minimum of 56px: the screen title ("Dashboard", "Cards") at the left, the sync state beside the Settings gear at the right, then a single 1px rule; Sign in again, the missing-file choice and the full sync error line appear below the rule while their state lasts. The app name "The Binder" appears only on the sign-in screen. Detail, form and Settings screens also carry the rule under their title. Cancel on the card form, or Android back, asks "Discard this card?" (add) or "Discard changes?" (edit) when the form holds a change or a photo; an untouched form closes at once.

The dashboard is a six-tile stat table (two columns by three rows), a Top teams and a Top players stat table of up to five rows each, then a Recently added row of four trading-card frames. The list is virtualised with absolutely positioned rows. Hit targets: `--target-min` is 48px.

### Named Rules
**The 48 Rule.** Anything tappable is at least 48px (`--target-min`) in height and width, visually or through its row; table cells are inset 4px so neighbours stay 8px apart.

## Elevation & Depth

Flat. No shadows, blur or backdrop-filter anywhere. Structure comes from 1px ink keylines, whitespace, and tone (panel one step off the ground in dark). Overlays are an ink or black scrim plus an opaque panel sheet. Pressed state is opacity 0.8; disabled is 0.5.

### Named Rules
**The Cheap Effects Rule.** No blur, drop shadow or animation-heavy effect: the device is a phone running a long virtualised list.

**The Whitespace Is The Divider Rule.** Sections are separated by space (`--gap-section`), not by ornaments. Where a divider is needed it is one 1px line in the rule colour, under screen titles and between rows; there is no dashed or red seam.

## Shapes

Three radii: print 3px (photo inside its frame, serial tag), frame 6px (buttons, frames, tables, dialogs, banners, sheet top corners), pill 999px (chips, count badge). Ruled fields have no radius, only a bottom line. Borders are always 1px (`--rule`); focus ring is 2px ink with 2px offset. Photos always sit in a 2.5:3.5 frame (`--frame-ratio`), turned to 3.5:2.5 when the photo is landscape, with a 3px cream matte and an inner keyline; the photo keeps its own ratio and is never cropped.

## Components

### Buttons
- **Shape:** frame radius (6px), min 48x48, 16px horizontal padding, transparent with a 1px ink border and ink text, weight 500.
- **Primary:** Ink fill and border, ground-coloured text, Inter 600 at 1rem, frame radius, 48px high. One per screen footer or sheet footer; in a row it takes the remaining width.
- **Danger:** Danger text, weight 600, no border by default (Sign out stays apart under a keyline in settings). On the card detail screen Delete is the outlined variant (`.danger.outline`: Danger text and 1px Danger border, transparent background) at the left of the action row, and Edit, the filled primary, at the right; both share the row equally with the same 48px height and frame radius, like Cancel left, Save right.
- **States:** pressed opacity 0.8; disabled 0.5; focus-visible 2px ink outline, 2px offset.
- **Add card:** the middle item of the bottom navigation (Dashboard, Add, Cards): a 24px plus in a 48x32 ink-filled frame with the frame radius (larger than the 24px icons beside it), ground-coloured plus, label "Add" at weight 600, accessible name "Add card". It is an action, never marked current, and the one entry point for adding on the dashboard and the list.

### Bottom navigation
Fixed to the bottom of the two top-level screens only (never on detail, forms, Settings or under a sheet's scrim), 64px plus the bottom inset, panel background with a keyline top border. Dashboard, Add and Cards share the width with 8px gaps; each is a button of at least 48x48 with a 24px inline-SVG icon above a label. Active is ink text at weight 600 with a solid icon and `aria-current="page"`; inactive destinations are Muted Ink at weight 400 with an outline icon (same shape, stroked), so the cue is weight and shape as well as colour; there is no underline or pill. Add keeps an ink label at weight 500. Tapping the active item does nothing. Settings stays a header action.

### Icon button
Icon-only 48x48 button for header actions (the Settings gear), borderless in the title row. Name from `aria-label`. Icons are inline SVG in `src/app/Icon.tsx` (gear, dashboard, cards, plus), `currentColor`, `aria-hidden`; no icon font or package.

### Stat table and tiles
One ruled block: panel background, 1px ink border, frame radius. Six tiles in a two-column grid; each is a 48px-minimum button inset 4px, with keylines drawn between cells (right of the left column, below the first four). Label on top (uppercase label size, Muted Ink), number below (Slab 700 at 2rem, ink). Never gold-filled. Tapping opens the list filtered to what the tile counts; the accessible name is "label, number".

### Recently added
Heading in Table size, then four equal columns (`--gap-frame` 12px gap) of trading-card frames with the player's name beneath at label size, weight 500, clamped to two lines. Each is a button that opens the card.

### Top teams and Top players
Two ruled stat tables of the same shape: up to five rows of at least 56px (`--size-team-min`) separated by keylines, team or player name at the left (ellipsis), count in Slab 700 at table size at the right.

### Chips and badge
Removable filter chip: ink fill, ground-coloured text, weight 500, pill radius, 48px min height, a trailing close mark; one per active filter, wrapping with 8px gaps; tapping removes the filter. The filter count badge is ink-filled, pill, label size 600.

The Sort button sits at the right end of the "Showing N" line, reads "Sort: Last name ↑" and opens a bottom sheet as tall as its content (the Filters sheet stays full height) with two radio groups, Order (Last name, Year, Team, Set; one column of 48dp rows on one left edge) and Direction (Ascending and Descending side by side), and no footer. A choice applies at once; the head's Close is the one close control (back and the scrim close it too).

### Tag
The serial stamp (for example 13/150): Slab 600 at label size, ink text, 1px ink outline, 3px radius, 6px horizontal padding. Sits at the right end of the player line in a list row and beside the title on the detail screen. Outline only, never filled, never coloured.

### Frames and photos
Trading-card frame as described in Shapes. List rows use a 96px slot, dashboard recents fill their column, the form holds one `.photo-tiles` row with a Front tile and a Back tile side by side, each a frame 96px high (an empty tile shows a camera icon and "Front" or "Back" over the placeholder; its name is "Add front photo" or "Change front photo" once filled), detail photos 200px high, showing the full photo once it is stored on the device (the thumbnail until then). Without a photo the frame shows the Print Placeholder. A tapped photo opens a 60vh zoom panel with the image contained.

### Inputs / Fields
Ruled like a card back: an ink-tinted (6% over panel) line to write on, with a 1px ink bottom border, no radius, no box, min 48px, 8px by 12px padding; textarea min 96px. Label above in the uppercase label style; placeholder in Muted Ink. Invalid fields get a Danger bottom border and a Danger label-size message. Checkbox is 24px with ink accent in a 48px row. The search label is visually hidden but present. On the add and edit forms Cancel and Save live in a sticky form bar (`.form-bar`): panel background, 1px rule along its top, pinned above the system navigation bar (`--inset-bottom`) while the form scrolls, and back in the flow at the form's end so the last field clears it. The save-blocked message sits inside the bar directly above the buttons; `scroll-padding-bottom` keeps a focused field clear of the bar.

### List row
Full-width borderless button with a keyline beneath, the frame slot at the left and two lines of text: player (body, weight 500, single-line ellipsis) with the Tag at the right end, and one quiet label-size line "year set, number" continuing with parallel, grade and quantity. The line never wraps: the extras shrink first, then the set, never the number. Row height 112px.

### Card facts
Detail screen, top to bottom: a header block (`header.detail-head`, one left edge, room to breathe: 16px from the top of the content to the title, `--space-2` (8px) between the title and the line, `--space-4` (16px) before the rule): the player as a Title with the Tag at the right end of its first line (a long name wraps left of the Tag) and one muted "year set, number" line; then a 1px rule under the block, `dl.facts` (uppercase muted label at the left, body value right-aligned, keylines between rows and below, none above after the rule, 16px row padding (`--pad-cell`), rows only for what the card has, Team and Parallel among them, never a second subtitle line), the photo thumbnails, a muted last-edited line, then one action row: Delete at the left as a danger-outlined button and Edit at the right as the primary button, equal in width and height.

### Sheets and dialogs
Bottom sheets over the scrim (z-index 10), panel background, 1px keyline top border, frame radius on the top corners only, full height with the top inset respected. Structure: head (Table-size title plus close), scrolling body, foot (keyline above, primary takes the width). Group headings inside are Slab Table-size with a keyline above. A photo tile opens a compact sheet titled "Front photo" or "Back photo" with full-width actions ("Scan front", "Pick front from photos"; once filled "Retake front", "Pick front from photos" and a danger "Remove front photo"); its Close button is the cancel. The Delete card confirmation is a centred panel (keyline border, frame radius, 320px wide at most) over the scrim, with Keep focused and a danger Delete; the scrim, Escape and Android back all mean Keep. Other confirm and needs-decision dialogs are inline panels with a keyline border and frame radius. Banners are panel boxes with underlined ink link text. Empty state is a keyline box with muted text. Sync status is a currentColor dot plus uppercase label text, `role="status"`, ink when idle and Danger on error, paused or needs-decision; it wraps rather than being cut.

### Navigation
The dashboard is the start destination: Android's back closes the app from there, and back from Cards shows the dashboard (switching with the bar adds no history). The bottom navigation switches between the two top-level screens; Cards keeps its last search, filters and sort. No screen has an on-screen Back button: Android's back button and gesture return one screen up (list to dashboard, detail to the dashboard or list it was opened from, Settings to where it was opened from). Forms keep Cancel and sheets keep Close.

## Do's and Don'ts

### Do:
- **Do** write every colour, space, radius, font face and type size as a token; add a light and a dark value for any new colour in `tokens.css`.
- **Do** give every tappable element at least 48px (`--target-min`) with 8px between neighbours.
- **Do** put photos in a 2.5:3.5 frame (3.5:2.5 for landscape) and never crop the photo.
- **Do** separate sections with whitespace, and set numbers in Roboto Slab.
- **Do** build new data lists as ruled tables (1px keylines) and new fields as ruled lines.
- **Do** keep the ink fill for the one primary action and no decorative red, and keep the confirming action (Save) at the bottom, in the sticky form bar.
- **Do** let the phone pick light or dark, and bundle any new font inside the app.

### Don't:
- **Don't** write colour literals (hex, rgb, hsl) outside `tokens.css`.
- **Don't** add blur, backdrop-filter or any shadow.
- **Don't** add an in-app theme toggle.
- **Don't** use red for anything but danger text.
- **Don't** wrap data in rounded filled cards; use rules, not boxes.
- **Don't** add a second Add card control to a screen, or a centered modal where a sheet fits.

### Not canonized (defects the build carries)
- The chip close mark is a text glyph (`content: "\00d7"` in `.chip::after`); future surfaces should use an inline SVG from `src/app/Icon.tsx`.
- Fixed sizes are tokens: `--size-tile-min` 72px (stat cell button), `--size-team-min` 56px (Top teams row), `--size-nav-add-w` 48px and `--size-nav-add-h` 32px (the Add frame), `--size-nav-icon` 24px (its plus).
- Sizes outside the token scales are one-off literals in `app.css`, not system tokens: 56px title row, 200px detail photo, 96px photo slot, list slot and textarea, 60vh zoom, 6px paddings and gaps, and the 1.3 / 1.1 line-heights.