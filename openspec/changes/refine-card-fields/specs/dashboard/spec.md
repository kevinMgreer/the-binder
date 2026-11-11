## MODIFIED Requirements

### Requirement: Six stat tiles
The system SHALL show these tiles in this order, each with its label and its number: Cards (the total number of cards, counting quantity), Distinct (the number of distinct cards), Autos (cards with the autograph flag), Relics (cards with the relic flag), Serial-numbered (cards marked serial-numbered; a card saved before the mark counts when it has a serial number or a print run) and Rookies (cards with the rookie flag). Every tile except Cards SHALL count distinct cards, not quantity. Deleted cards SHALL NOT be counted. The dashboard SHALL NOT show a tile for one team, manufacturer or parallel; those are reached through the Filter.

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

#### Scenario: Print run without serial-numbered
- **GIVEN** a card with print run 99 that is not marked serial-numbered
- **WHEN** the dashboard is shown
- **THEN** the Serial-numbered tile does not count it
