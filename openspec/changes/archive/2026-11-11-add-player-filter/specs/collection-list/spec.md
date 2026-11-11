## MODIFIED Requirements

### Requirement: The active filter is clear
The system SHALL put all filters behind one Filter button that opens a full-height sheet with the existing labelled fields grouped under headings, a Show N cards button and a Clear all button. The sheet SHALL include a Player text field, in the Card group, that keeps only cards whose player name contains the typed text, ignoring case and accents. It SHALL show each applied filter as a removable chip below the search row, show a count badge on the Filter button, and show how many cards match. No chips appear while no filter is applied.

#### Scenario: Filter applied
- **WHEN** the user sets a Year value in the filter sheet and taps Show cards
- **THEN** the sheet closes, a Year chip with a remove control appears below the search row, the Filter button shows a count of 1, and the list shows the number of matching cards

#### Scenario: Remove a filter
- **WHEN** the user taps the remove control on an applied chip
- **THEN** that filter clears and the list updates

#### Scenario: Nothing applied
- **WHEN** no filter is applied
- **THEN** no chip row is shown and the Filter button has no badge

#### Scenario: Filter by player
- **GIVEN** one card's player is "Ronald Acuña Jr." and another card's team is "Acuna Aces" with a different player
- **WHEN** the user types "acuna" in the Player field and taps Show cards
- **THEN** only the Ronald Acuña Jr. card is listed, a Player chip appears, and the Filter button shows a count of 1

#### Scenario: Clear all clears the player filter
- **GIVEN** a Player filter is applied
- **WHEN** the user taps Clear all
- **THEN** the Player filter clears and the Search text is kept
