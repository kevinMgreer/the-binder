## MODIFIED Requirements

### Requirement: Screens use design tokens only
The system SHALL define every colour, font family, spacing, radius, type size, rule width, spacing rhythm, card-frame ratio and touch-target size as a token in one place, and SHALL style every screen from those tokens alone.

#### Scenario: No raw colours outside the token file
- **WHEN** the style sheets and components are scanned for colour literals (hex, rgb or hsl)
- **THEN** the only matches are in the token file

#### Scenario: No raw font families outside the token file
- **WHEN** the style sheets and components are scanned for `font-family` values and `font` shorthands naming a family
- **THEN** every one refers to a font token, and the font faces are named only in the token file and the font imports

#### Scenario: Changing a token restyles every screen
- **WHEN** a test overrides the ink token on the root element
- **THEN** the computed border colour of the Add frame in the bottom navigation and the computed background of the card form's Save button, the filter sheet's Show cards button and the detail screen's Edit button all change to it

#### Scenario: Changing the ink token restyles text and rules
- **WHEN** a test overrides the ink token on the root element
- **THEN** the computed colour of the screen title, an active filter chip's fill, a serial tag and a stat-table rule all change to it

### Requirement: Light is Card-Back Calm and dark is Night Game
The system SHALL show the "Card-Back Calm" palette when the phone is light and the "Night Game" palette when the phone is dark, with these colour roles:

| Role | Card-Back Calm (light) | Night Game (dark) |
|---|---|---|
| ground (page background) | #f3ecdc | #101a30 |
| panel (stat tables, sheets, dialogs, bottom bar) | #f3ecdc | #17233f |
| ink (text, icons, rules) | #1c2b4a | #f3ecdc |
| muted ink (secondary text) | #4a5670 | #c2bcae |
| rule (row, fact and sheet rules; full ink stays for frames, buttons, field underlines and the stat and team table outlines) | #1c2b4a at 55 percent | #f3ecdc at 30 percent |
| danger (error text, Delete, Sign out) | #a82a22 | #ff8a80 |
| frame print border | #f3ecdc | #f3ecdc |

No other colour roles SHALL exist besides the sheet scrim and the photo placeholder.

#### Scenario: Light palette
- **WHEN** the phone is light and the dashboard is shown
- **THEN** the page background computes to #f3ecdc, the title colour to #1c2b4a and the Add frame in the bottom navigation to a #f3ecdc background with a 1 px #1c2b4a border and a #1c2b4a plus

#### Scenario: Dark palette
- **WHEN** the phone is dark and the dashboard is shown
- **THEN** the page background computes to #101a30, the stat table background to #17233f, the title colour to #f3ecdc and the Add frame in the bottom navigation to a #17233f background with a 1 px #f3ecdc border and a #f3ecdc plus

#### Scenario: Every role has both values
- **WHEN** the token file is read
- **THEN** every colour role in the table has a light value and its own dark value

### Requirement: Every screen wears the card-back look
The system SHALL draw every screen on the ground colour with ink text, ruled tables instead of boxed buttons, and no translucent, blurred or shadowed surface:
- Cards list: rows on the ground separated by 1 px rules, the search field as a ruled line (a tinted field with an ink underline and no box), the Filter button as an outlined box, applied filter chips as ink-filled pills with ground-coloured text, the shown count in uppercase label type; adding is the Add item of the bottom navigation (an outlined frame, never filled), with no standalone button or band.
- Card detail: the player title in the slab face with the serial stamp beside it, a rule below, the ruled fact list, framed photo strip, Edit as the primary button, Delete in danger text below a rule.
- Card form: fields as ruled lines with uppercase labels, framed photo slots each closed by a rule, Identify with Claude set apart from the Scan and Pick buttons, Cancel as an ink-outlined button at the left of the action row and Save as the primary button at its right, the discard confirmation as a dialog with Keep editing ink-outlined and Discard in danger text.
- Settings: groups as ruled stat-table rows, Sign out in danger text apart below a rule.
- Filter sheet: the full screen height, the panel colour, slab group headings above a rule (distinct from the uppercase field labels), Year from and Year to side by side, a rule above the foot, Show cards as the primary button, Clear all ink-outlined.
- Sort sheet: the panel colour, only as tall as its content, slab group headings with tighter spacing than the filter sheet, option rows of one height with their radios in one column on one left edge, Ascending and Descending side by side in one row, a rule above the foot, Done as the primary button.
- Sync error: the title row keeps only the dot and the short words "Sync problem"; the full wording ("Sync problem, retrying (N unsynced)") sits in a full-width status line under the title rule in the danger colour at 14 px.
- Dialogs, banners and the empty state: the panel colour with a 1 px rule border, no gradient.

#### Scenario: No translucent surface remains
- **WHEN** every button, input, select, textarea, dialog and banner on each screen is checked in both themes
- **THEN** none has a background gradient, a box shadow or a translucent background, and none uses a removed colour token

#### Scenario: Secondary buttons are outlined in ink
- **WHEN** the card form's Cancel and the filter sheet's Clear all are shown
- **THEN** each has a transparent background, a 1 px ink border and ink text, and is at least 48 dp high

#### Scenario: Active chips are ink
- **WHEN** a filter is applied on the list
- **THEN** its chip's background computes to the ink colour and its text to the ground colour, at least 4.5 to 1

#### Scenario: Screens at phone size in both themes
- **WHEN** the list, detail, form, Settings, filter sheet and sort sheet are shown at 360 by 800 in each theme
- **THEN** the page background is the ground colour, text is legible, the touch-target rule holds and nothing scrolls sideways
