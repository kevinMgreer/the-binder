## MODIFIED Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, a header whose one row holds the title, the sync state and Settings, then one row holding the search field and a Filter button, then the "Showing N" line with a Sort button at its right end, then the card list. It SHALL NOT show a collection count line (total and distinct cards) on this screen; the dashboard's Cards and Distinct tiles carry those totals, and the "Showing N" line stays. It SHALL offer exactly one add action, the Add item of the bottom navigation (named "Add card"), which opens the add form.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the sync state, the search field, the Filter button and the Sort button are visible without scrolling, and at least three card rows are visible below them

#### Scenario: Sort button shares the Showing line
- **WHEN** the collection screen is shown on a 360 by 800 phone
- **THEN** the Sort button's top and bottom lie within the vertical extent of the "Showing N" line's row, at its right end, so it adds no row of its own

#### Scenario: No count line
- **WHEN** the collection screen is shown for a collection of 12 cards, 10 of them distinct
- **THEN** no text reading "12 cards, 10 distinct" (or any "N cards, N distinct" line) is shown, and the "Showing 10" line is shown

#### Scenario: One add action
- **WHEN** the collection screen is shown
- **THEN** exactly one button named "Add card" is visible, it is the Add item of the bottom navigation, and tapping it opens the add form

#### Scenario: Sign in again stays reachable
- **WHEN** the session needs a new sign-in
- **THEN** Sign in again is shown in the header area, beneath the title row, in one tap

### Requirement: The first screen holds with the bottom navigation
The system SHALL keep the collection list's first screen usable with the bottom navigation bar: the "Cards" title, the sync state, the gear, the search field, the Filter button and the Sort button visible without scrolling, and at least three full card rows inside the list scroller. The list scroller SHALL end at least 8 dp above the top of the bottom navigation bar, so the last row can scroll clear of the bar.

#### Scenario: First screen with the bar
- **WHEN** the collection screen opens on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing
- **THEN** the "Cards" title, the sync state, the Settings gear, the search field, the Filter button, the "Showing N" line and the Sort button are in view, the list scroller's bottom is at least 8 dp above the top of the bottom navigation bar, and at least three card rows end above the scroller's bottom

#### Scenario: Last row reachable
- **WHEN** the user scrolls a list of 20 cards to its end
- **THEN** the last row is fully visible above the bottom navigation bar and can be tapped

## ADDED Requirements

### Requirement: The user chooses the list order
The system SHALL let the user order the collection list by Last name, Year, Team or Set, ascending or descending. The Sort button SHALL show the current order as "Sort: <order> ↑" when ascending and "Sort: <order> ↓" when descending, with an accessible name that says the direction in words (for example "Sort: Last name, ascending"), and SHALL be at least 48 dp in height and width. Tapping it SHALL open a sheet with the four orders as one single choice and Ascending and Descending as a second single choice; a choice SHALL reorder the list at once, and the sheet closes with its Close control or the back button. The order SHALL apply to the cards the search and filters show. Last name uses each card's sort name or the last name derived from its player, as the card catalog defines. Text is compared ignoring case and accents, with numbers inside text compared by value, and an empty value sorts as empty text. Cards equal on the chosen order SHALL follow year, then set, then card number. Descending SHALL list the cards in exactly the reverse of the ascending order. The default order SHALL be Last name ascending. The chosen order SHALL stay while the app runs, including after opening a card, Settings or the dashboard and coming back, and SHALL return to Last name ascending when the app starts fresh; it SHALL NOT be stored on the device or in Drive.

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
