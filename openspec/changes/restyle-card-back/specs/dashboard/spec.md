## MODIFIED Requirements

### Requirement: The dashboard follows the design system
The system SHALL draw the dashboard only from the design tokens, in both the light and the dark theme, as a card back: the title row with a stitch rule below it; the six tiles as one ruled stat table of two columns and three rows (1 px rules around and between the cells, each cell at least 56 dp high, the label in uppercase label type above the number in the slab face at stat size (32 px), the Rookies cell carrying a small stitch-coloured flag that is hidden from screen readers); a stitch rule; Recently added as one even row of four trading-card frames, each with the player's name beneath as its caption; a stitch rule; Top teams as a ruled stat table, one row per team, at least 48 dp high, the team name at the left and its number in the slab face at the right; then the gold Add card button. In the dark theme both stat tables sit on the panel colour with a 6 px radius. Each tile, each Recently added card and each Top teams entry SHALL be a tappable control at least 48 by 48 dp whose text is readable with the contrast the theme requires, with no background gradient, translucency or shadow. A tile's accessible name SHALL hold its label and its number.

#### Scenario: Both themes
- **WHEN** the dashboard is shown with the phone in dark mode and then in light mode
- **THEN** the tiles, the Recently added cards and the Top teams entries render in that theme with legible text and no colour literal outside the tokens file

#### Scenario: Ruled stat table
- **WHEN** the dashboard is shown
- **THEN** the six tiles sit in two columns and three rows inside one ruled table, every cell has a 1 px rule on each side it shares with another cell, and no cell has a radius, gradient or shadow of its own

#### Scenario: Recently added as trading cards
- **WHEN** the dashboard is shown with four or more cards
- **THEN** Recently added shows four trading-card frames of equal width in one row with 8 dp between them, each with the player's name beneath it on at most two lines

#### Scenario: Top teams as a ruled table
- **WHEN** the dashboard is shown with cards from three teams
- **THEN** Top teams shows three rows separated by 1 px rules, each with the team name at the left and its number at the right in the slab face

#### Scenario: Tiles at phone size
- **WHEN** the dashboard is shown on a 360 by 800 phone
- **THEN** every tile is at least 48 dp in each direction, all six tiles are visible without scrolling, nothing on the dashboard scrolls horizontally, and nothing sits under the system bars

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the Autos tile reading 12
- **THEN** it announces "Autos, 12"

#### Scenario: Rookies flag is not read out
- **WHEN** a screen reader focuses the Rookies tile reading 58
- **THEN** it announces "Rookies, 58" and nothing for the flag
