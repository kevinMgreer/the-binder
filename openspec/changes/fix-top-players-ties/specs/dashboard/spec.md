## MODIFIED Requirements

### Requirement: Top players
The system SHALL show on the dashboard, under the heading "Top players", up to five players with the most distinct cards, most first, with ties in alphabetical order of the player's last name. The last name SHALL be the key the Cards list sorts by: the Sort name of a card when it has one, else the last name derived from the player string; a player with several cards SHALL use the first non-empty Sort name among those cards, else the key of the first card met; players with the same key SHALL be ordered by their full name. Player names SHALL be compared ignoring case, accents and surrounding spaces, so spellings of one player make one entry, shown with the first spelling met; a card's player is its whole player string, so a team card or a card of two players is its own entry. A player's number SHALL count distinct cards, not quantity. Each entry SHALL be a tappable control showing the player name and its number, with the accessible name "player, number". Tapping an entry SHALL open the collection list with the Player filter set to that name and a Player chip, earlier search and filters cleared. Because the Player filter matches part of a name, the list SHALL show at least as many cards as the entry's number. The group SHALL NOT be shown when no card has a player.

#### Scenario: Order, merged spellings and distinct count
- **GIVEN** 3 cards of "Ronald Acuña Jr." (one of them with quantity 3 and one saved as "ronald acuna jr."), 2 cards of "Mookie Betts", 2 cards of "Aaron Judge" and 1 card of "Shohei Ohtani"
- **WHEN** the dashboard is shown
- **THEN** Top players lists Ronald Acuña Jr. reading 3, then Mookie Betts 2, then Aaron Judge 2, then Shohei Ohtani 1

#### Scenario: Ties sort by last name
- **GIVEN** 2 cards of "Babe Ruth" and 2 cards of "Hank Aaron"
- **WHEN** the dashboard is shown
- **THEN** Top players lists Hank Aaron reading 2, then Babe Ruth reading 2

#### Scenario: A suffix does not decide the order
- **GIVEN** 2 cards of "Ronald Acuña Jr." and 2 cards of "Mookie Betts"
- **WHEN** the dashboard is shown
- **THEN** Top players lists Ronald Acuña Jr. before Mookie Betts, because "Ronald Acuña Jr." sorts under Acuña

#### Scenario: A Sort name changes the tie order
- **GIVEN** 3 cards of "Zack Judge", one of them with Sort name "Aaa", and 3 cards of "Mookie Betts" with no Sort name
- **WHEN** the dashboard is shown
- **THEN** Top players lists Zack Judge before Mookie Betts

#### Scenario: The count still ranks first
- **GIVEN** 2 cards of "Zack Wheeler" and 1 card of "Hank Aaron"
- **WHEN** the dashboard is shown
- **THEN** Top players lists Zack Wheeler reading 2, then Hank Aaron reading 1

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
