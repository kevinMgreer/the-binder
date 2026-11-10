# dashboard Specification

## Purpose
The first screen of the app: a summary of the collection as six stat tiles (Cards, Distinct, Autos, Relics, Serial-numbered, Rookies), each of which opens the collection list filtered to the cards it counts, then a Recently added group, whose cards each open that card, and a Top teams group, whose entries each open the list filtered to that team.

## Requirements

### Requirement: The app opens on the dashboard
The system SHALL show the dashboard as the first screen after sign-in, with a header whose one row holds the title, the sync state and Settings, then the stat tiles, then the Recently added group and the Top teams group when they have content, and the same single "Add card" button as the collection list. It SHALL NOT have a Browse collection button: the bottom navigation's Cards destination opens the list.

#### Scenario: Launch
- **WHEN** the signed-in user opens the app
- **THEN** the dashboard is shown, with the sync state in words on the title row and the stat tiles below the header

#### Scenario: No Browse collection button
- **WHEN** the dashboard is shown
- **THEN** no button named "Browse collection" exists, and tapping a tile or the Cards destination of the bottom navigation shows the collection list

#### Scenario: Add from the dashboard
- **WHEN** the user taps Add card on the dashboard and saves a card entered by hand
- **THEN** the dashboard is shown again with its counts including the new card, and the new card first in Recently added

### Requirement: The dashboard stays fast on a large collection
The system SHALL compute all tile numbers, the Recently added cards and the Top teams in one pass over the cards, only when the list of cards it is given changes, and SHALL show the dashboard with its numbers within 1 second of the page starting to load (navigation start to the Cards tile reading the full count, not the first render with zeros) for a collection of 5,000 cards on a mid-range Android phone.

#### Scenario: Large collection
- **GIVEN** a collection of 5,000 cards
- **WHEN** the user opens the app with 4x CPU throttling in the performance test
- **THEN** within 1 second of navigation start the dashboard's Cards tile reads 5,000 (one copy of each seeded card)

#### Scenario: No recount without a change
- **WHEN** the dashboard re-renders for a sync state change while the cards list is unchanged
- **THEN** the tile numbers, the Recently added cards and the Top teams are not recomputed

### Requirement: The dashboard follows the design system
The system SHALL draw the dashboard only from the existing design tokens, in both the light and the dark theme. Each tile, each Recently added card and each Top teams entry SHALL be a tappable pocket at least 48 by 48 dp whose text is readable with the contrast the theme requires. A tile's accessible name SHALL hold its label and its number.

#### Scenario: Both themes
- **WHEN** the dashboard is shown with the phone in dark mode and then in light mode
- **THEN** the tiles, the Recently added cards and the Top teams entries render in that theme with legible text and no colour literal outside the tokens file

#### Scenario: Tiles at phone size
- **WHEN** the dashboard is shown on a 360 by 800 phone
- **THEN** every tile is at least 48 dp in each direction, all six tiles are visible without scrolling, nothing on the dashboard scrolls horizontally, and nothing sits under the system bars

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the Autos tile reading 12
- **THEN** it announces "Autos, 12"

### Requirement: Six stat tiles
The system SHALL show these tiles in this order, each with its label and its number: Cards (the total number of cards, counting quantity), Distinct (the number of distinct cards), Autos (cards with the autograph flag), Relics (cards with the relic flag), Serial-numbered (cards with a serial number or a print run) and Rookies (cards with the rookie flag). Every tile except Cards SHALL count distinct cards, not quantity. Deleted cards SHALL NOT be counted. The dashboard SHALL NOT show a tile for one team, manufacturer or parallel; those are reached through the Filter.

#### Scenario: Tile counts
- **GIVEN** a collection of: an autographed rookie card with team "Atlanta Braves" and quantity 2; a relic card with print run 99 and an unreadable serial; and a plain card
- **WHEN** the dashboard is shown
- **THEN** the tiles read Cards 4, Distinct 3, Autos 1, Relics 1, Serial-numbered 1, Rookies 1, in that order, and no other tile is shown

#### Scenario: No team or parallel tiles
- **WHEN** the dashboard is shown for a collection holding Topps Gold cards and Atlanta Braves cards
- **THEN** no tile named "Topps Gold" or "Atlanta Braves" exists

#### Scenario: Empty collection reads zero
- **WHEN** the collection has no cards
- **THEN** every tile reads 0 and each stays tappable

### Requirement: A tile opens the list filtered to its cards
The system SHALL open the collection list when a tile is tapped, with that tile's filters applied and shown as removable chips and any earlier search and filters cleared. For every tile except Cards, the number of cards the list shows SHALL equal the tile's number; Cards counts quantity, so its list shows the distinct rows. Cards and Distinct SHALL open the list with no filter.

#### Scenario: Tap Rookies
- **GIVEN** the Rookies tile reads 3
- **WHEN** the user taps it
- **THEN** the collection list shows 3 cards with a Rookie chip

#### Scenario: Tap Autos after another filter
- **GIVEN** the list was filtered to team "Atlanta Braves"
- **WHEN** the user returns to the dashboard and taps Autos
- **THEN** the list shows only autographed cards, with an Autograph chip and no Team chip

#### Scenario: Remove a tile's filter
- **WHEN** the user taps Relics and then removes the Relic chip
- **THEN** the list shows every card

### Requirement: Recently added cards
The system SHALL show on the dashboard, under the heading "Recently added", the four most recently added cards (by when each card was first saved, newest first; editing a card SHALL NOT move it), or all cards when there are fewer than four. Each SHALL be a tappable control showing the card's front thumbnail in the photo's own orientation (or the placeholder when it has none) and the player's name on one line, with the accessible name "player, year set #number". Tapping one SHALL open that card's detail screen, and back from there SHALL return to the dashboard. The group SHALL NOT be shown when the collection has no cards.

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

#### Scenario: Empty collection
- **WHEN** the collection has no cards
- **THEN** no Recently added heading or placeholder is shown

### Requirement: Top teams
The system SHALL show on the dashboard, under the heading "Top teams", up to five teams with the most distinct cards, most first, with ties in alphabetical order. Team names SHALL be compared ignoring case, accents and surrounding spaces, so spellings of one team make one entry; cards with no team SHALL NOT be counted. Each entry SHALL be a tappable control showing the team name and its number, with the accessible name "team, number". Tapping an entry SHALL open the collection list filtered to that team with a Team chip, earlier search and filters cleared, and the list SHALL show exactly as many cards as the entry's number. The group SHALL NOT be shown when no card has a team.

#### Scenario: Order and merged spellings
- **GIVEN** 2 cards with team "Atlanta Braves" and 1 with "atlanta braves", 2 with "New York Mets", 2 with "Chicago Cubs", and 1 card with no team
- **WHEN** the dashboard is shown
- **THEN** Top teams lists one Atlanta Braves entry reading 3, then Chicago Cubs 2, then New York Mets 2

#### Scenario: At most five
- **GIVEN** cards from eight teams
- **WHEN** the dashboard is shown
- **THEN** Top teams lists exactly five entries

#### Scenario: Tap a team
- **GIVEN** the Top teams entry for Atlanta Braves reads 3 and the list was filtered to Autograph
- **WHEN** the user taps that entry
- **THEN** the collection list shows 3 cards with a Team chip "Atlanta Braves" and no Autograph chip

#### Scenario: No teams
- **WHEN** no card in the collection has a team
- **THEN** no Top teams heading or placeholder is shown
