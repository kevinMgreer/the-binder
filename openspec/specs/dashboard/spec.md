# dashboard Specification

## Purpose
The first screen of the app: a summary of the collection as a fixed set of stat tiles, each of which opens the collection list filtered to the cards it counts.

## Requirements

### Requirement: The app opens on the dashboard
The system SHALL show the dashboard as the first screen after sign-in, with a header holding the title, the sync state and Settings, the stat tiles, and the same single "Add card" button as the collection list. It SHALL NOT have a Browse collection button: the bottom navigation's Cards destination opens the list.

#### Scenario: Launch
- **WHEN** the signed-in user opens the app
- **THEN** the dashboard is shown, with the sync state in words and the stat tiles

#### Scenario: No Browse collection button
- **WHEN** the dashboard is shown
- **THEN** no button named "Browse collection" exists, and tapping a tile or the Cards destination of the bottom navigation shows the collection list

#### Scenario: Add from the dashboard
- **WHEN** the user taps Add card on the dashboard and saves a card entered by hand
- **THEN** the dashboard is shown again with its counts including the new card

### Requirement: Fixed stat tiles
The system SHALL show these tiles in this order, each with its label and its number: Cards (the total number of cards, counting quantity), Distinct (the number of distinct cards), Autos (cards with the autograph flag), Relics (cards with the relic flag), Serial-numbered (cards with a serial number or a print run), Topps Gold (cards whose manufacturer is "Topps" and whose parallel name is "Gold"), and Atlanta Braves (cards whose team is "Atlanta Braves"). Every tile except Cards SHALL count distinct cards, not quantity. Name comparisons SHALL ignore case, accents and surrounding spaces. Deleted cards SHALL NOT be counted.

#### Scenario: Counts
- **GIVEN** a collection of: an autographed Topps card with parallel "Gold", team "Atlanta Braves" and quantity 2; a relic card with print run 99 and an unreadable serial; and a plain card
- **WHEN** the dashboard is shown
- **THEN** the tiles read Cards 4, Distinct 3, Autos 1, Relics 1, Serial-numbered 1, Topps Gold 1, Atlanta Braves 1

#### Scenario: Topps Gold is exact
- **GIVEN** cards from manufacturer "topps" with parallel "gold", from "Topps" with parallel "Gold Refractor", and from "Bowman" with parallel "Gold"
- **WHEN** the dashboard is shown
- **THEN** the Topps Gold tile reads 1

#### Scenario: Empty collection
- **WHEN** the collection has no cards
- **THEN** every tile reads 0 and each stays tappable

### Requirement: A tile opens the list filtered to what it counts
The system SHALL open the collection list when a tile is tapped, with that tile's filters applied and shown as removable chips and any earlier search and filters cleared. For every tile except Cards, the number of cards the list shows SHALL equal the tile's number; Cards counts quantity, so its list shows the distinct rows. Cards and Distinct SHALL open the list with no filter.

#### Scenario: Tap Topps Gold
- **GIVEN** the Topps Gold tile reads 3
- **WHEN** the user taps it
- **THEN** the collection list shows 3 cards with a Manufacturer chip "Topps" and a Parallel chip "Gold"

#### Scenario: Tap Autos after another filter
- **GIVEN** the list was filtered to team "Atlanta Braves"
- **WHEN** the user returns to the dashboard and taps Autos
- **THEN** the list shows only autographed cards, with an Autograph chip and no Team chip

#### Scenario: Remove the tile's filter
- **WHEN** the user taps Atlanta Braves and then removes the Team chip
- **THEN** the list shows every card

### Requirement: The dashboard stays fast on a large collection
The system SHALL compute all tile numbers in one pass over the cards, only when the list of cards it is given changes, and SHALL show the dashboard with its numbers within 1 second of the page starting to load (navigation start to the Cards tile reading the full count, not the first render with zeros) for a collection of 5,000 cards on a mid-range Android phone.

#### Scenario: Large collection
- **GIVEN** a collection of 5,000 cards
- **WHEN** the user opens the app with 4x CPU throttling in the performance test
- **THEN** within 1 second of navigation start the dashboard's Cards tile reads 5,000 (one copy of each seeded card)

#### Scenario: No recount without a change
- **WHEN** the dashboard re-renders for a sync state change while the cards list is unchanged
- **THEN** the tile numbers are not recomputed

### Requirement: The dashboard follows the design system
The system SHALL draw the dashboard only from the existing design tokens, in both the light and the dark theme, with each tile a tappable pocket at least 48 by 48 dp whose label and number are readable text with the contrast the theme requires, and whose accessible name holds both the label and the number.

#### Scenario: Both themes
- **WHEN** the dashboard is shown with the phone in dark mode and then in light mode
- **THEN** the tiles render in that theme with legible text and no colour literal outside the tokens file

#### Scenario: Tiles at phone size
- **WHEN** the dashboard is shown on a 360 by 800 phone
- **THEN** every tile is at least 48 dp in each direction, all seven tiles are visible without horizontal scrolling, and nothing sits under the system bars

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the Autos tile reading 12
- **THEN** it announces "Autos, 12"
