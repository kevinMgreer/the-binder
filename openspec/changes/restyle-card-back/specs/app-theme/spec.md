## MODIFIED Requirements

### Requirement: Screens use design tokens only
The system SHALL define every colour, font family, spacing, radius, type size, rule width, stitch, card-frame ratio and touch-target size as a token in one place, and SHALL style every screen from those tokens alone.

#### Scenario: No raw colours outside the token file
- **WHEN** the style sheets and components are scanned for colour literals (hex, rgb or hsl)
- **THEN** the only matches are in the token file

#### Scenario: No raw font families outside the token file
- **WHEN** the style sheets and components are scanned for `font-family` values and `font` shorthands naming a family
- **THEN** every one refers to a font token, and the font faces are named only in the token file and the font imports

#### Scenario: Changing a token restyles every screen
- **WHEN** a test overrides the gold token on the root element
- **THEN** the computed background of the Add card button, the card form's Save button, the filter sheet's Show cards button and the detail screen's Edit button all change to it, and no chip, tag or link changes

#### Scenario: Changing the ink token restyles text and rules
- **WHEN** a test overrides the ink token on the root element
- **THEN** the computed colour of the screen title, an active filter chip's fill, a serial tag and a stat-table rule all change to it

### Requirement: Text is legible and controls are reachable
The system SHALL give body text a contrast ratio of at least 4.5 to 1 against every background it sits on in both themes (the ground, the panel and the gold button), SHALL give the stitch and the frame keyline at least 3 to 1 against the ground and the panel they sit on, and SHALL make every tappable control at least 48 dp square with at least 8 dp between neighbouring controls.

#### Scenario: Contrast in both themes
- **WHEN** the token pairs of each theme are measured: text, muted text and danger on the ground and on the panel, and on-gold text on the gold
- **THEN** every pair is at least 4.5 to 1

#### Scenario: Non-text contrast in both themes
- **WHEN** the stitch colour and the frame keyline colour of each theme are measured against the ground and the panel
- **THEN** every pair is at least 3 to 1

#### Scenario: Touch targets
- **WHEN** any button, chip, input or row is measured on a 360 dp wide phone
- **THEN** it is at least 48 dp high and wide, with at least 8 dp to the next control

### Requirement: Destructive actions stay apart
The system SHALL keep destructive actions (delete card, sign out) visually distinct and away from primary actions: drawn as danger-coloured text, never filled with gold and never in the stitch colour.

#### Scenario: Delete is not beside Edit
- **WHEN** the card detail screen is shown
- **THEN** Delete is separated from Edit by at least 24 dp or a rule, and is not drawn in gold

#### Scenario: Sign out is apart in settings
- **WHEN** the settings screen is shown
- **THEN** Sign out is separated from the other settings by at least 24 dp or a rule, and is not drawn in gold

## ADDED Requirements

### Requirement: Light is Card-Back Calm and dark is Night Game
The system SHALL show the "Card-Back Calm" palette when the phone is light and the "Night Game" palette when the phone is dark, with these colour roles:

| Role | Card-Back Calm (light) | Night Game (dark) |
|---|---|---|
| ground (page background) | #f3ecdc | #101a30 |
| panel (stat tables, sheets, dialogs, bottom bar) | #f3ecdc | #17233f |
| ink (text, icons, rules) | #1c2b4a | #f3ecdc |
| muted ink (secondary text) | #4a5670 | #c2bcae |
| rule (row, fact and sheet rules; full ink stays for frames, buttons, field underlines and the stat and team table outlines) | #1c2b4a at 55 percent | #f3ecdc at 30 percent |
| stitch (seam, Rookies flag) | #c8372d | #e0574b |
| gold (primary action fill) | #f1c24a | #f1c24a |
| on-gold (text on gold) | #1c2b4a | #101a30 |
| danger (error text, Delete, Sign out) | #a82a22 | #ff8a80 |
| frame print border | #f3ecdc | #f3ecdc |

No other colour roles SHALL exist besides the sheet scrim and the photo placeholder.

#### Scenario: Light palette
- **WHEN** the phone is light and the dashboard is shown
- **THEN** the page background computes to #f3ecdc, the title colour to #1c2b4a and the Add card button background to #f1c24a

#### Scenario: Dark palette
- **WHEN** the phone is dark and the dashboard is shown
- **THEN** the page background computes to #101a30, the stat table background to #17233f, the title colour to #f3ecdc and the Add card button background to #f1c24a

#### Scenario: Every role has both values
- **WHEN** the token file is read
- **THEN** every colour role in the table has a light value and its own dark value

### Requirement: Fonts ship inside the app
The system SHALL draw titles and numbers in the slab face Roboto Slab (weights 600 and 700) with tabular figures, and body text and labels in the sans face Inter (weights 400, 500 and 600), both loaded from font files packaged in the APK under a free licence (SIL Open Font License 1.1 or Apache 2.0) whose licence text ships with them. The app SHALL make no network request for a font, and SHALL fall back to the system serif and sans if a face fails to load.

#### Scenario: No font request leaves the app
- **WHEN** the app opens and every screen is visited with all requests outside the app's own origin blocked
- **THEN** no request for a font file or font stylesheet is made to any other origin, and `document.fonts.check` reports both faces loaded

#### Scenario: Faces in use
- **WHEN** the dashboard is shown
- **THEN** the title and the stat numbers compute to the Roboto Slab family with `font-variant-numeric: tabular-nums`, and the stat labels and body text to the Inter family

#### Scenario: Offline launch
- **WHEN** the phone is offline and the app opens
- **THEN** the title renders in Roboto Slab, the same as online

### Requirement: Type scale
The system SHALL use these sizes and no others for text: 12 label (uppercase, letter-spaced 0.08em, sans 600, never small-caps variants, which shrink the capitals below 12), 14 body (sans 400, list player name 500), 16 gold button label (sans 600), 18 table number and group heading (slab 700), 28 screen title (slab 700), 32 stat number (slab 700), each in CSS px scaled by the phone's text size setting.

#### Scenario: Sizes on the dashboard
- **WHEN** the dashboard is shown at the default text size
- **THEN** the title computes to 28 px, a stat number to 32 px, a stat label to a computed 12 px in uppercase with normal font-variant-caps, a group heading (Recently added, Top teams) to 18 px in the slab face, a Top teams count to 18 px and a Recently added caption to 12 px

#### Scenario: No stray sizes
- **WHEN** every text element on the dashboard, list, detail, form, Settings and filter sheet is measured at the default text size
- **THEN** each font size is one of 12, 14, 16, 18, 28 or 32 px

### Requirement: Red is the stitch and nothing else
The system SHALL draw the stitch as a double dashed rule (two 1.5 px dashed lines 5 px apart, in the stitch colour) under each screen title, between the dashboard's sections and under the active bottom-navigation tab, and SHALL use the stitch colour elsewhere only for the small Rookies flag on the dashboard. Error text, Delete and Sign out SHALL use the danger colour, not the stitch colour.

#### Scenario: Stitch under the title
- **WHEN** the dashboard, the list, the card detail, the card form or Settings is shown
- **THEN** a stitch rule sits under the screen title

#### Scenario: Red stays rare
- **WHEN** every element of the dashboard is checked for a computed colour, background or border equal to the stitch colour
- **THEN** the only matches are the stitch rules, the active tab's underline and the Rookies flag

### Requirement: Photos sit in trading-card frames
The system SHALL show every card photo and the photo placeholder inside a trading-card frame: a 2.5 by 3.5 rectangle (3.5 by 2.5 when the photo is wider than tall), 6 px radius, a 1 px keyline in the ink colour, a 3 px inner print border in the frame print colour and a thin inner rule, with the whole photo shown inside (never cropped). This applies to the list thumbnails, Recently added, the detail photo strip and the form's photo slots.

#### Scenario: Portrait frame ratio
- **WHEN** a card with a portrait front photo is shown in Recently added and in the list
- **THEN** each frame's width-to-height ratio is 2.5 to 3.5 within 2 percent

#### Scenario: Landscape frame
- **WHEN** a card whose front photo is wider than tall is shown in Recently added and in the list
- **THEN** each frame's width-to-height ratio is 3.5 to 2.5 within 2 percent and the image inside keeps the photo's ratio within 2 percent

#### Scenario: Placeholder framed
- **WHEN** a card without a front photo is shown
- **THEN** its placeholder sits in a portrait frame with the same keyline and radius

### Requirement: Every screen wears the card-back look
The system SHALL draw every screen on the ground colour with ink text, ruled tables instead of boxed buttons, and no translucent, blurred or shadowed surface:
- Cards list: rows on the ground separated by 1 px rules, the search field as a ruled line (a tinted field with an ink underline and no box), the Filter button as an outlined box, applied filter chips as ink-filled pills with ground-coloured text, the shown count in uppercase label type; the fixed Add card button sits on a ground-coloured band so content stops above it.
- Card detail: the player title in the slab face with the serial stamp beside it, a stitch below, the ruled fact list, framed photo strip, Edit in gold, Delete in danger text below a rule.
- Card form: fields as ruled lines with uppercase labels, framed photo slots each closed by a rule, Identify with Claude set apart from the Scan and Pick buttons, Save in gold, Cancel as an ink-outlined button.
- Settings: groups as ruled stat-table rows, Sign out in danger text apart below a rule.
- Filter sheet: the panel colour, slab group headings above a rule (distinct from the uppercase field labels), Year from and Year to side by side, a rule above the foot, Show cards in gold, Clear all ink-outlined.
- Sync error: the title row keeps only the dot and the short words "Sync problem"; the full wording ("Sync problem, retrying (N unsynced)") sits in a full-width status line under the stitch in the danger colour at 14 px.
- Dialogs, banners and the empty state: the panel colour with a 1 px rule border, no gradient.

#### Scenario: No pocket surface remains
- **WHEN** every button, input, select, textarea, dialog and banner on each screen is checked in both themes
- **THEN** none has a background gradient, a box shadow or a translucent background, and none uses a removed pocket token

#### Scenario: Secondary buttons are outlined in ink
- **WHEN** the card form's Cancel and the filter sheet's Clear all are shown
- **THEN** each has a transparent background, a 1 px ink border and ink text, and is at least 48 dp high

#### Scenario: Active chips are ink
- **WHEN** a filter is applied on the list
- **THEN** its chip's background computes to the ink colour and its text to the ground colour, at least 4.5 to 1

#### Scenario: Screens at phone size in both themes
- **WHEN** the list, detail, form, Settings and filter sheet are shown at 360 by 800 in each theme
- **THEN** the page background is the ground colour, text is legible, the touch-target rule holds and nothing scrolls sideways
