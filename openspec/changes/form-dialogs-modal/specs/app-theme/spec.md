## MODIFIED Requirements

### Requirement: Every screen wears the card-back look
The system SHALL draw every screen on the ground colour with ink text, ruled tables instead of boxed buttons, and no translucent, blurred or shadowed surface:
- Cards list: rows on the ground separated by 1 px rules, the search field as a ruled line (a tinted field with an ink underline and no box), the Filter button as an outlined box, applied filter chips as ink-filled pills with ground-coloured text, the shown count in uppercase label type; adding is the Add item of the bottom navigation, with no standalone button or band.
- Card detail: the player title in the slab face with the serial stamp beside it, a rule below, the ruled fact list, framed photo strip, Edit as the primary button, Delete in danger text below a rule.
- Card form: fields as ruled lines with uppercase labels, framed photo slots each closed by a rule, Identify with Claude set apart from the Scan and Pick buttons, Cancel as an ink-outlined button at the left of the action row and Save as the primary button at its right, the discard pair in place of the bottom bar, with no visible question text (the question is the group's accessible name), as a Discard button outlined in danger on the left and a Keep editing primary button on the right, the same pair as card detail's Delete and Edit.
- Settings: groups as ruled stat-table rows, Sign out in danger text apart below a rule.
- Filter sheet: the full screen height, the panel colour, slab group headings above a rule (distinct from the uppercase field labels), Year from and Year to side by side, a rule above the foot, Show cards as the primary button, Clear all ink-outlined.
- Sort sheet: the panel colour, only as tall as its content, slab group headings with tighter spacing than the filter sheet, option rows of one height with their radios in one column on one left edge, Ascending and Descending side by side in one row, no footer and no Done button (its header Close is the one close control).
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

