## REMOVED Requirements

### Requirement: Destructive actions stay apart
**Reason**: The owner wants Delete in the same row as Edit on the card detail screen, so its scenario "Delete is not beside Edit" no longer holds. Replaced by "Destructive actions are distinct".
**Migration**: None for users. The e2e test "Delete is not beside Edit" in `e2e/design.spec.ts` is replaced by "Delete is a danger-outlined button left of Edit, matching Edit's size"; the Sign out scenario carries over unchanged.

## ADDED Requirements

### Requirement: Destructive actions are distinct
The system SHALL keep destructive actions (delete card, sign out) visually distinct from primary actions: never filled like the primary button, drawn in the danger colour (text, and on the card detail screen the border too), always confirmed before they take effect, and the danger colour is used for nothing decorative. On the card detail screen Delete SHALL be a danger-outlined button in the same row as Edit, left of it, with Edit's height, width share and radius; Sign out SHALL stay separated from the other settings.

#### Scenario: Delete is a danger-outlined button left of Edit, matching Edit's size
- **WHEN** the card detail screen is shown
- **THEN** Delete is in the same row as Edit and left of it, at least 8 dp from it, with the same height, the same width within 1 dp and the same border radius as Edit, its text and its border compute to the danger colour and its background is transparent, while Edit is filled with the ink colour

#### Scenario: Sign out is apart in settings
- **WHEN** the settings screen is shown
- **THEN** Sign out is separated from the other settings by at least 24 dp or a rule, and is not drawn as a filled primary button

## MODIFIED Requirements

### Requirement: Generous spacing from tokens
The system SHALL space every screen from these spacing tokens: `--gutter` 24 px (page sides), `--gap-section` 32 px (between sections), `--gap-field` 24 px (between form fields), `--gap-label` 8 px (a label to its value or field), `--pad-cell` 16 px (stat cell, Top teams row and fact row padding), `--pad-row` 16 px (the gap between a list thumbnail and its text; list rows themselves are padded 0 0 8 px so a row stays 112 dp), `--gap-frame` 12 px (between Recently added frames) and `--gap-caption` 8 px (frame to caption). List rows SHALL stay 112 dp high.

#### Scenario: Gutter and sections
- **WHEN** the dashboard is shown on a 360 by 800 phone
- **THEN** the stat table starts 24 px from the left edge, and the table, Recently added and Top teams are 32 px apart

#### Scenario: Cells, frames and fields
- **WHEN** the dashboard and the card form are shown
- **THEN** stat cell text starts 16 px inside its rule, Recently added frames are 12 px apart with the caption 8 px below, form fields are 24 px apart, and every cell and control keeps the 48 dp and 8 dp rules

#### Scenario: Card detail header spacing
- **WHEN** the card detail screen is shown
- **THEN** the header uses spacing tokens only: `--space-4` above the title, `--space-2` between the title and the quiet line, `--space-4` between the quiet line and the rule, and the quiet line is in the muted ink colour
