## ADDED Requirements

### Requirement: The dashboard counts owned cards only
Every figure on the dashboard SHALL leave wanted cards out: the six stat tiles, Top teams, Top players and Recently added. A card saved before the Wanted mark existed counts as owned. The list a tile, team or player row opens SHALL show owned cards only, so its count still equals the figure tapped.

#### Scenario: Wanted cards are not counted
- **GIVEN** an owned autographed rookie card with team "Atlanta Braves" and quantity 2, and a wanted autographed card with team "Cincinnati Reds"
- **WHEN** the dashboard is shown
- **THEN** the tiles read Cards 2, Distinct 1, Autos 1, Relics 0, Serial-numbered 0, Rookies 1, Top teams lists only "Atlanta Braves", and Recently added shows only the owned card

#### Scenario: A tile's list matches its number
- **GIVEN** 3 owned autographed cards and 2 wanted autographed cards
- **WHEN** the user taps the Autos tile, which reads 3
- **THEN** the list shows 3 cards with an Autograph chip and no Show chip

### Requirement: A quiet wanted count opens the wish list
When the collection holds at least one wanted card, the dashboard SHALL show one quiet text line under the stat tiles reading "N wanted" (distinct wanted cards), not styled as a stat tile, at least 48 dp high as a touch target, with the accessible name "Wanted, N". Tapping it SHALL open the collection list with Show Wanted picked and any earlier search and filters cleared. With no wanted card the line SHALL NOT be shown.

#### Scenario: Wanted line opens the wanted list
- **GIVEN** 2 wanted cards and 5 owned cards
- **WHEN** the dashboard is shown and the user taps "2 wanted"
- **THEN** the collection list shows the 2 wanted cards with a "Wanted" chip

#### Scenario: No wanted cards, no line
- **GIVEN** only owned cards
- **WHEN** the dashboard is shown
- **THEN** no wanted line is shown and the six tiles are as before
