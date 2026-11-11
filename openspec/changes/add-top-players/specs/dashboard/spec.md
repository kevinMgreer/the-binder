## ADDED Requirements

### Requirement: Top players
The system SHALL show on the dashboard, under the heading "Top players", up to five players with the most distinct cards, most first, with ties in alphabetical order. Player names SHALL be compared ignoring case, accents and surrounding spaces, so spellings of one player make one entry, shown with the first spelling met; a card's player is its whole player string, so a team card or a card of two players is its own entry. A player's number SHALL count distinct cards, not quantity. Each entry SHALL be a tappable control showing the player name and its number, with the accessible name "player, number". Tapping an entry SHALL open the collection list with the Player filter set to that name and a Player chip, earlier search and filters cleared. Because the Player filter matches part of a name, the list SHALL show at least as many cards as the entry's number. The group SHALL NOT be shown when no card has a player.

#### Scenario: Order, merged spellings and distinct count
- **GIVEN** 3 cards of "Ronald Acuña Jr." (one of them with quantity 3 and one saved as "ronald acuna jr."), 2 cards of "Mookie Betts", 2 cards of "Aaron Judge" and 1 card of "Shohei Ohtani"
- **WHEN** the dashboard is shown
- **THEN** Top players lists Ronald Acuña Jr. reading 3, then Aaron Judge 2, then Mookie Betts 2, then Shohei Ohtani 1

#### Scenario: At most five
- **GIVEN** cards from seven players
- **WHEN** the dashboard is shown
- **THEN** Top players lists exactly five entries

#### Scenario: Quantity does not count
- **GIVEN** one card of "Aaron Judge" with quantity 3
- **WHEN** the dashboard is shown
- **THEN** the Aaron Judge entry reads 1

#### Scenario: Tap a player
- **GIVEN** the Top players entry for Aaron Judge reads 2 and the list was filtered to Autograph
- **WHEN** the user taps that entry
- **THEN** the collection list shows 2 cards with a Player chip "Aaron Judge" and no Autograph chip

#### Scenario: No cards
- **WHEN** the collection has no cards
- **THEN** no Top players heading or placeholder is shown

#### Scenario: Ruled rows
- **WHEN** the dashboard is shown with cards from three players
- **THEN** Top players shows three rows separated by 1 px rules, each at least 48 dp high with the player name at the left and its number at the right in the slab face

## MODIFIED Requirements

### Requirement: The app opens on the dashboard
The system SHALL show the dashboard as the first screen after sign-in, with a header whose one row holds the title, the sync state and Settings, then the stat tiles, then the Top teams group, the Top players group and last the Recently added group, each when it has content; adding a card is done with the Add item of the bottom navigation, the same on the collection list. It SHALL NOT have a Browse collection button: the bottom navigation's Cards destination opens the list.

#### Scenario: Launch
- **WHEN** the signed-in user opens the app
- **THEN** the dashboard is shown, with the sync state in words on the title row and the stat tiles below the header

#### Scenario: No Browse collection button
- **WHEN** the dashboard is shown
- **THEN** no button named "Browse collection" exists, and tapping a tile or the Cards destination of the bottom navigation shows the collection list

#### Scenario: Add from the dashboard
- **WHEN** the user taps Add card (the Add item of the bottom navigation) on the dashboard and saves a card entered by hand
- **THEN** the dashboard is shown again with its counts including the new card, and the new card first in Recently added

#### Scenario: Recently added is last
- **WHEN** the dashboard is shown with cards that have teams and players
- **THEN** the groups appear in the order Top teams, Top players, Recently added, below the tiles

### Requirement: The dashboard stays fast on a large collection
The system SHALL compute all tile numbers, the Recently added cards, the Top teams and the Top players in one pass over the cards, only when the list of cards it is given changes, and SHALL show the dashboard with its numbers within 1 second of the page starting to load (navigation start to the Cards tile reading the full count, not the first render with zeros) for a collection of 5,000 cards on a mid-range Android phone.

#### Scenario: Large collection
- **GIVEN** a collection of 5,000 cards
- **WHEN** the user opens the app with 4x CPU throttling in the performance test
- **THEN** within 1 second of navigation start the dashboard's Cards tile reads 5,000 (one copy of each seeded card)

#### Scenario: No recount without a change
- **WHEN** the dashboard re-renders for a sync state change while the cards list is unchanged
- **THEN** the tile numbers, the Recently added cards, the Top teams and the Top players are not recomputed

### Requirement: The dashboard follows the design system
The system SHALL draw the dashboard only from the design tokens, in both the light and the dark theme, as a card back: the title row with a 1 px rule below it, and 32 px of whitespace between the sections; the six tiles as one ruled stat table of two columns and three rows (1 px rules around and between the cells, each cell at least 56 dp high, the label in uppercase label type above the number in the slab face at stat size (32 px); cell padding 16 px; no flag or other mark on any cell, the Rookies cell included); Top teams and Top players each as a ruled stat table, one row per entry, at least 56 dp high, the name at the left and its number in the slab face at the right; Recently added as one even row of four trading-card frames 12 px apart, each with the player's name beneath as its caption 8 px below the frame; and the bottom navigation with its Add item. In the dark theme the stat tables sit on the panel colour with a 6 px radius. Each tile, each Top teams entry, each Top players entry and each Recently added card SHALL be a tappable control at least 48 by 48 dp whose text is readable with the contrast the theme requires, with no background gradient, translucency or shadow. A tile's accessible name SHALL hold its label and its number.

#### Scenario: Both themes
- **WHEN** the dashboard is shown with the phone in dark mode and then in light mode
- **THEN** the tiles, the Top teams and Top players entries and the Recently added cards render in that theme with legible text and no colour literal outside the tokens file

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
