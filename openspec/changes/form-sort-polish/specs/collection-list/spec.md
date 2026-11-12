## MODIFIED Requirements

### Requirement: The user chooses the list order
The system SHALL let the user order the collection list by Last name, Year, Team or Set, ascending or descending. The Sort button SHALL show the current order as "Sort: <order> ↑" when ascending and "Sort: <order> ↓" when descending, with an accessible name that says the direction in words (for example "Sort: Last name, ascending"), and SHALL be at least 48 dp in height and width. Tapping it SHALL open a bottom sheet named "Sort" that is only as tall as its content (the Filters sheet stays full height), with the four orders as one single choice in one column and Ascending and Descending as a second single choice side by side in one row. Every option row SHALL be at least 48 dp high, the order rows SHALL be of equal height, and the order radios and the Ascending radio SHALL sit on the same left edge. A choice SHALL reorder the list at once; the sheet closes with its Close control, a primary Done button in a footer laid out like the Filters sheet's footer, or the back button, and closing it changes nothing further. The order SHALL apply to the cards the search and filters show. Last name uses each card's sort name or the last name derived from its player, as the card catalog defines. Text is compared ignoring case and accents, with numbers inside text compared by value, and an empty value sorts as empty text. Cards equal on the chosen order SHALL follow year, then set, then card number. Descending SHALL list the cards in exactly the reverse of the ascending order. The default order SHALL be Last name ascending. The chosen order SHALL stay while the app runs, including after opening a card, Settings or the dashboard and coming back, and SHALL return to Last name ascending when the app starts fresh; it SHALL NOT be stored on the device or in Drive.

#### Scenario: Default order
- **GIVEN** cards for "Mookie Betts", "Ronald Acuña Jr." and "Freddie Freeman"
- **WHEN** the app starts fresh and the collection screen opens
- **THEN** the rows read Acuña, Betts, Freeman from the top, and the Sort button reads "Sort: Last name ↑"

#### Scenario: Year descending
- **GIVEN** cards from 2019, 2024 and 2021
- **WHEN** the user opens Sort, picks Year and Descending
- **THEN** the list shows the 2024 card first, then 2021, then 2019, and the Sort button reads "Sort: Year ↓" with the accessible name "Sort: Year, descending"

#### Scenario: Team order
- **GIVEN** cards with teams "Texas Rangers", "Atlanta Braves" and "Los Angeles Dodgers"
- **WHEN** the user picks Team and Ascending
- **THEN** the list shows the Braves card, then the Dodgers card, then the Rangers card

#### Scenario: Set order
- **GIVEN** cards from the sets "Topps Chrome" and "Bowman"
- **WHEN** the user picks Set and Ascending
- **THEN** the Bowman card is listed before the Topps Chrome card

#### Scenario: Ties follow year, set and number
- **GIVEN** two cards of "Ronald Acuña Jr.", one from 2024 and one from 2019
- **WHEN** the list is in Last name ascending order
- **THEN** the 2019 card is listed before the 2024 card

#### Scenario: Descending is the exact reverse
- **GIVEN** any collection
- **WHEN** the user switches the same order from Ascending to Descending
- **THEN** the rows appear in exactly the reverse sequence

#### Scenario: Sort applies to the filtered list
- **WHEN** the Team filter is "Atlanta Braves" and the order is Year ascending
- **THEN** only Braves cards are shown, oldest year first, and the "Showing N" count is unchanged by the order

#### Scenario: Kept while the app runs
- **WHEN** the user picks Year, opens a card and goes back, then switches to the dashboard and back to Cards
- **THEN** the list is still in Year order and the Sort button reads "Sort: Year ↑"

#### Scenario: Reset on a fresh start
- **WHEN** the user picks Team Descending and the app is closed and started again
- **THEN** the collection screen shows Last name ascending and the Sort button reads "Sort: Last name ↑"

#### Scenario: Done closes the sheet and keeps the choice
- **WHEN** the user opens Sort, picks Team, and taps Done
- **THEN** the Sort sheet is closed, the list is in Team order and the Sort button reads "Sort: Team ↑"

#### Scenario: The Sort sheet does not fill the screen
- **WHEN** the Sort sheet is opened on a 360 by 800 screen with no bottom inset, and then the Filters sheet is opened
- **THEN** the Sort sheet is less than two thirds of the screen height with no empty space between its Done footer and its bottom padding, while the Filters sheet still reaches from below the status bar to the bottom of the screen

#### Scenario: Options line up
- **WHEN** the Sort sheet is open at 360 by 800
- **THEN** the Last name, Year, Team and Set rows each are at least 48 dp high and of equal height, the left edges of the four order radios and the Ascending radio are within 1 dp of each other, Ascending and Descending share one row of the same height with Descending to the right, and the Done button spans the footer like the Filters sheet's Show cards button
