## MODIFIED Requirements

### Requirement: The dashboard follows the design system
The system SHALL draw the dashboard only from the design tokens, in both the light and the dark theme, as a card back: the title row with a 1 px rule below it, and 32 px of whitespace between the sections; the six tiles as one ruled stat table of two columns and three rows (1 px rules around and between the cells, each cell at least 56 dp high, the label in uppercase label type above the number in the slab face at stat size (32 px); cell padding 16 px; no flag or other mark on any cell, the Rookies cell included); Recently added as one even row of four trading-card frames 12 px apart, each with the player's name beneath as its caption 8 px below the frame; Top teams as a ruled stat table, one row per team, at least 56 dp high, the team name at the left and its number in the slab face at the right; and the bottom navigation with its Add item. In the dark theme both stat tables sit on the panel colour with a 6 px radius. Each tile, each Recently added card and each Top teams entry SHALL be a tappable control at least 48 by 48 dp whose text is readable with the contrast the theme requires, with no background gradient, translucency or shadow. A tile's accessible name SHALL hold its label and its number.

#### Scenario: Both themes
- **WHEN** the dashboard is shown with the phone in dark mode and then in light mode
- **THEN** the tiles, the Recently added cards and the Top teams entries render in that theme with legible text and no colour literal outside the tokens file

#### Scenario: Ruled stat table
- **WHEN** the dashboard is shown
- **THEN** the six tiles sit in two columns and three rows inside one ruled table, every cell has a 1 px rule on each side it shares with another cell, and no cell has a radius, gradient or shadow of its own

#### Scenario: Recently added as trading cards
- **WHEN** the dashboard is shown with four or more cards
- **THEN** Recently added shows four trading-card frames of equal width in one row with 12 dp between them, each with the player's name beneath it on at most two lines

#### Scenario: Top teams as a ruled table
- **WHEN** the dashboard is shown with cards from three teams
- **THEN** Top teams shows three rows separated by 1 px rules, each with the team name at the left and its number at the right in the slab face

#### Scenario: Tiles at phone size
- **WHEN** the dashboard is shown on a 360 by 800 phone
- **THEN** every tile is at least 48 dp in each direction, all six tiles are visible without scrolling, nothing on the dashboard scrolls horizontally, and nothing sits under the system bars

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the Autos tile reading 12
- **THEN** it announces "Autos, 12"

#### Scenario: Rookies tile is like the others
- **WHEN** the Rookies tile reading 58 is shown and focused by a screen reader
- **THEN** it carries no flag or pseudo-element mark, and announces "Rookies, 58"

### Requirement: Recently added cards
The system SHALL show on the dashboard, under the heading "Recently added", the four most recently added cards (by when each card was first saved, newest first; editing a card SHALL NOT move it), or all cards when there are fewer than four. Each SHALL be a tappable control showing the card's front thumbnail in a trading-card frame in the photo's own orientation (or the placeholder when it has none) and the player's name beneath it on at most two lines, then an ellipsis, with the accessible name "player, year set #number". Tapping one SHALL open that card's detail screen, and back from there SHALL return to the dashboard. The group SHALL NOT be shown when the collection has no cards.

#### Scenario: Newest first
- **GIVEN** six cards saved one after another, A first and F last
- **WHEN** the dashboard is shown
- **THEN** Recently added shows F, E, D, C in that order

#### Scenario: Editing does not reorder
- **GIVEN** the six cards above
- **WHEN** the user edits card A and returns to the dashboard
- **THEN** Recently added still shows F, E, D, C

#### Scenario: Open a recent card
- **WHEN** the user taps a card in Recently added and then presses back
- **THEN** that card's detail screen is shown, and back shows the dashboard

#### Scenario: Long names
- **WHEN** a card's player name is longer than two lines at the column width
- **THEN** the caption shows two lines and ends in an ellipsis

#### Scenario: Empty collection
- **WHEN** the collection has no cards
- **THEN** no Recently added heading or placeholder is shown

### Requirement: The app opens on the dashboard
The system SHALL show the dashboard as the first screen after sign-in, with a header whose one row holds the title, the sync state and Settings, then the stat tiles, then the Recently added group and the Top teams group when they have content; adding a card is done with the Add item of the bottom navigation, the same on the collection list. It SHALL NOT have a Browse collection button: the bottom navigation's Cards destination opens the list.

#### Scenario: Launch
- **WHEN** the signed-in user opens the app
- **THEN** the dashboard is shown, with the sync state in words on the title row and the stat tiles below the header

#### Scenario: No Browse collection button
- **WHEN** the dashboard is shown
- **THEN** no button named "Browse collection" exists, and tapping a tile or the Cards destination of the bottom navigation shows the collection list

#### Scenario: Add from the dashboard
- **WHEN** the user taps Add card (the Add item of the bottom navigation) on the dashboard and saves a card entered by hand
- **THEN** the dashboard is shown again with its counts including the new card, and the new card first in Recently added
