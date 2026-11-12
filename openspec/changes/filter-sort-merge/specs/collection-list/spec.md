## MODIFIED Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, a header whose one row holds the title, the sync state and Settings, then one row holding the search field and one Filter and sort button, then the "Showing N" line holding the count and the current order as quiet text at its left and the List / Grid view button at its right end, then the cards in the chosen view. It SHALL NOT show a separate Sort button. It SHALL NOT show a collection count line (total and distinct cards) on this screen; the dashboard's Cards and Distinct tiles carry those totals, and the "Showing N" line stays. It SHALL offer exactly one add action, the Add item of the bottom navigation (named "Add card"), which opens the add form.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the sync state, the search field, the Filter and sort button, the "Showing N" line with its order text and the view button are visible without scrolling, and at least three card rows are visible below them

#### Scenario: Sort button shares the Showing line
- **WHEN** the collection screen is shown on a 360 by 800 phone
- **THEN** no button whose name starts with "Sort" exists on the screen, and the order text lies within the vertical extent of the "Showing N" line's row, so the order adds no row of its own

#### Scenario: Toggle shares the Showing line
- **WHEN** the collection screen is shown on a 360 by 800 phone for 5,000 cards in the order Last name ascending, at the default text size
- **THEN** the line reads "Showing 5000 · Last name ↑" on one line, the view button lies within the vertical extent of the line's row at its right end, the text (its own extent, not only its box) and the view button do not overlap, there are at least 8 dp between them, and neither extends past the screen's content edge

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
The system SHALL keep the collection list's first screen usable with the bottom navigation bar: the "Cards" title, the sync state, the gear, the search field, the Filter and sort button, the "Showing N" line with its order text and the view button visible without scrolling, and inside the scroller at least three full card rows in List view, or at least two full rows of tiles in Grid view. The scroller SHALL end at least 8 dp above the top of the bottom navigation bar, so the last row can scroll clear of the bar.

#### Scenario: First screen with the bar
- **WHEN** the collection screen opens on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing
- **THEN** the "Cards" title, the sync state, the Settings gear, the search field, the Filter and sort button, the "Showing N" line with its order text and the view button are in view, the list scroller's bottom is at least 8 dp above the top of the bottom navigation bar, and at least three card rows end above the scroller's bottom

#### Scenario: First screen in Grid view
- **WHEN** the collection screen opens in Grid view on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing, for 12 cards
- **THEN** the same controls are in view, the scroller's bottom is at least 8 dp above the top of the bottom navigation bar, and at least six tiles (two rows of three) end above the scroller's bottom

#### Scenario: Last row reachable
- **WHEN** the user scrolls a list of 20 cards to its end
- **THEN** the last row is fully visible above the bottom navigation bar and can be tapped

#### Scenario: Last tile reachable
- **WHEN** the user scrolls a grid of 20 cards to its end
- **THEN** the last tile and its caption are fully visible above the bottom navigation bar and the tile can be tapped

### Requirement: The active filter is clear
The system SHALL put all filters and the list order behind one button in the search row. The button SHALL read "Filter & sort", SHALL have the accessible name "Filter and sort" ("Filter and sort, N applied" while N filters are applied), SHALL be at least 48 dp high and SHALL keep its label on one line. It SHALL open a full-height sheet named "Filter and sort" holding, top to bottom, the order choice that "The list order is chosen in the Filter and sort sheet" describes, the existing labelled filter fields grouped under headings, and a footer with a Show N cards button and a Clear all button. The sheet SHALL include a Player text field, in the Card group, that keeps only cards whose player name contains the typed text, ignoring case and accents. The system SHALL show each applied filter as a removable chip below the search row, show a count badge of applied filters on the Filter and sort button, and show how many cards match. No chips appear while no filter is applied. The list order is not a filter: it SHALL NOT be counted in the badge, SHALL NOT show a chip, and Clear all SHALL clear every filter while keeping the search text and the list order.

#### Scenario: Filter applied
- **WHEN** the user sets a Year value in the Filter and sort sheet and taps Show cards
- **THEN** the sheet closes, a Year chip with a remove control appears below the search row, the Filter and sort button shows a count of 1 and is named "Filter and sort, 1 applied", and the list shows the number of matching cards

#### Scenario: Remove a filter
- **WHEN** the user taps the remove control on an applied chip
- **THEN** that filter clears and the list updates

#### Scenario: Nothing applied
- **WHEN** no filter is applied
- **THEN** no chip row is shown and the Filter and sort button has no badge and is named "Filter and sort"

#### Scenario: Filter by player
- **GIVEN** one card's player is "Ronald Acuña Jr." and another card's team is "Acuna Aces" with a different player
- **WHEN** the user types "acuna" in the Player field and taps Show cards
- **THEN** only the Ronald Acuña Jr. card is listed, a Player chip appears, and the Filter and sort button shows a count of 1

#### Scenario: Clear all clears the player filter
- **GIVEN** a Player filter is applied
- **WHEN** the user taps Clear all
- **THEN** the Player filter clears and the Search text is kept

#### Scenario: The order is not a filter
- **GIVEN** no filter is applied
- **WHEN** the user picks Year and Descending in the Filter and sort sheet and taps Show cards
- **THEN** the Filter and sort button has no badge and is named "Filter and sort", and no chip row is shown

#### Scenario: Clear all keeps the order and the search
- **GIVEN** the search "acu", a Team filter and the order Year descending
- **WHEN** the user taps Clear all and then Show cards
- **THEN** the Team chip is gone, the badge is gone, the search field still reads "acu", and the list is still in Year descending order with the order text "Year ↓"

#### Scenario: The button fits the search row
- **WHEN** the collection screen is shown on a 360 by 800 phone with 12 filters applied
- **THEN** the Filter and sort button shows "Filter & sort" and the badge "12" on one line, is at least 48 dp high, lies on the search field's row, and the search field is at least 120 dp wide

### Requirement: The user chooses list or grid view
The system SHALL offer, at the right end of the "Showing N" row, a view switch that is one icon button at least 48 dp in height and width, with at least 8 dp between it and the "Showing N" text with its order text. It SHALL show the icon of the view a tap switches to (the grid icon while the list is shown, the list icon while the grid is shown) and SHALL be named for that action: "Grid view" while the list is shown and "List view" while the grid is shown. It SHALL NOT use `aria-pressed`, because its name already tells the state to come. Tapping it SHALL switch to the other view at once, showing the same cards (the same search, filters, chips, "Showing N" count and order) from the top. List view SHALL show the ruled rows the "Each card is a ruled row" requirement describes; Grid view SHALL show the tiles the "The grid shows cards as framed tiles" requirement describes. The empty-collection and no-match messages SHALL be the same in both views, and the toggle SHALL stay shown with them. The default view SHALL be List. The chosen view SHALL be kept on the device, so it is the view shown after opening a card, Settings or the dashboard and coming back, and after the app is closed and started again; it SHALL NOT be stored in Drive. When the device storage cannot be read or written, the app SHALL use List view (or keep the view chosen in this run) and SHALL NOT show an error. The list order keeps its own rule: it is not stored and returns to Last name ascending on a fresh start.

#### Scenario: Default is List
- **GIVEN** the view has never been chosen on this device
- **WHEN** the collection screen opens
- **THEN** the cards are shown as rows, one button named "Grid view" is shown in the view switch's place and no button named "List view" exists

#### Scenario: Switch to Grid
- **WHEN** the user taps "Grid view"
- **THEN** the cards are shown as tiles in the same order, the "Showing N" count is unchanged, the button is now named "List view" and shows the list icon, and tapping it shows the rows again

#### Scenario: Toggle targets
- **WHEN** the collection screen is shown on a 360 by 800 phone
- **THEN** the view button is at least 48 dp high and wide

#### Scenario: Filters, search and sort apply in Grid view
- **GIVEN** Grid view, the Team filter "Atlanta Braves", the search "acu" and the order Year descending
- **WHEN** the collection screen is shown
- **THEN** only Braves cards matching "acu" are shown as tiles, newest year first, the Team chip shows, and "Showing N" counts the tiles

#### Scenario: Empty and no-match in Grid view
- **GIVEN** Grid view
- **WHEN** the collection is empty, and then when a filter matches no card
- **THEN** the screen shows "Your binder is empty. Scan a card or add one by hand." and then "No cards match. Clear the search or a filter.", exactly as in List view, and the view toggle stays shown

#### Scenario: Kept after a relaunch, Sort still resets
- **WHEN** the user picks Grid view and the order Team descending, and the app is closed and started again
- **THEN** the collection screen shows Grid view and the order text reads "Last name ↑"

#### Scenario: Kept while the app runs
- **WHEN** the user picks Grid view, opens a card and goes back, then switches to the dashboard and back to Cards
- **THEN** the collection screen is still in Grid view

#### Scenario: Storage unavailable
- **GIVEN** the device storage throws on every read and write
- **WHEN** the collection screen opens and the user taps "Grid view"
- **THEN** the screen opens in List view, switches to Grid view, and no error is shown

### Requirement: Sheets clear the system bars
The system SHALL keep every sheet and its pinned buttons above the system navigation or gesture bar, using the bottom safe-area inset (the Capacitor `--safe-area-inset-bottom` variable or `env(safe-area-inset-bottom)`, whichever is larger, the same inset `#root` uses) plus a 16 dp gap.

#### Scenario: Sheet above a bottom bar
- **WHEN** the Filter and sort sheet is open and the bottom inset is 48 dp
- **THEN** the sheet's last button ends at least 64 dp above the bottom edge of the screen

## ADDED Requirements

### Requirement: The list order is chosen in the Filter and sort sheet
The system SHALL let the user order the collection list by Last name, Year, Team or Set, ascending or descending, from the Filter and sort sheet, and SHALL offer no other sort control. The sheet SHALL start with the order choice, above the first filter group: a group headed "Sort by" with the four orders as one single choice in one column, then a group headed "Direction" with Ascending and Descending as a second single choice side by side in one row. Every option row SHALL be at least 48 dp high, the order rows SHALL be of equal height, and the order radios and the Ascending radio SHALL sit on the same left edge. A choice SHALL reorder the list at once; Show N cards, the Close control, the back button and a tap on the scrim close the sheet and keep the choice. The "Showing N" line SHALL show the current order after the count as quiet text, "· <order> ↑" when ascending and "· <order> ↓" when descending (for example "Showing 5000 · Last name ↑"), in the same style as the count; the arrow SHALL NOT be read aloud, and the order's accessible text SHALL say the direction in words, "sorted by <order>, ascending" or "sorted by <order>, descending". The order text SHALL be plain text, not a button or link, and a tap on it SHALL do nothing. The order SHALL apply to the cards the search and filters show. Last name uses each card's sort name or the last name derived from its player, as the card catalog defines. Text is compared ignoring case and accents, with numbers inside text compared by value, and an empty value sorts as empty text. Cards equal on the chosen order SHALL follow year, then set, then card number. Descending SHALL list the cards in exactly the reverse of the ascending order. The default order SHALL be Last name ascending. The chosen order SHALL stay while the app runs, including after opening a card, Settings or the dashboard and coming back, and SHALL return to Last name ascending when the app starts fresh; it SHALL NOT be stored on the device or in Drive.

#### Scenario: Default order
- **GIVEN** cards for "Mookie Betts", "Ronald Acuña Jr." and "Freddie Freeman"
- **WHEN** the app starts fresh and the collection screen opens
- **THEN** the rows read Acuña, Betts, Freeman from the top, and the Showing line reads "Showing 3 · Last name ↑"

#### Scenario: Year descending
- **GIVEN** cards from 2019, 2024 and 2021
- **WHEN** the user opens Filter and sort, picks Year and Descending
- **THEN** the list behind the sheet shows the 2024 card first, then 2021, then 2019, before the sheet is closed; after it closes the order text reads "· Year ↓" and its accessible text is "sorted by Year, descending"

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
- **THEN** only Braves cards are shown, oldest year first, and neither the "Showing N" count nor the Show N cards button changes with the order

#### Scenario: Kept while the app runs
- **WHEN** the user picks Year, opens a card and goes back, then switches to the dashboard and back to Cards
- **THEN** the list is still in Year order and the order text reads "· Year ↑"

#### Scenario: Reset on a fresh start
- **WHEN** the user picks Team Descending and the app is closed and started again
- **THEN** the collection screen shows Last name ascending and the order text reads "· Last name ↑"

#### Scenario: Sort comes first in the sheet
- **WHEN** the Filter and sort sheet is opened
- **THEN** the "Sort by" group with the Last name, Year, Team and Set radios and the "Direction" group with Ascending and Descending come before the Year filter group, Last name and Ascending are checked by default, and the footer holds Show N cards and Clear all

#### Scenario: Options line up
- **WHEN** the Filter and sort sheet is open at 360 by 800
- **THEN** the Last name, Year, Team and Set rows each are at least 48 dp high and of equal height, the left edges of the four order radios and the Ascending radio are within 1 dp of each other, and Ascending and Descending share one row of the same height with Descending to the right

#### Scenario: Closing keeps the choice
- **WHEN** the user opens Filter and sort, picks Team, and closes the sheet with Close, then repeats with back, then with Show N cards
- **THEN** each time the sheet is closed, the list is in Team order and the order text reads "· Team ↑"

#### Scenario: One sort control
- **WHEN** the collection screen is shown
- **THEN** no button whose name starts with "Sort" exists, no dialog named "Sort" can be opened, and the order text has no button or link role

#### Scenario: Order text is plain text
- **WHEN** the user taps the order text "· Last name ↑"
- **THEN** no sheet opens and nothing changes

## REMOVED Requirements

### Requirement: The user chooses the list order
**Reason**: The separate Sort button and its compact Sort sheet are removed; the order is chosen in the one Filter and sort sheet and shown as text in the "Showing N" line.
**Migration**: Every sort rule (the four orders, the direction, the default, ties, the exact reverse, applying to the filtered cards, kept while the app runs, reset on a fresh start, not stored) moves unchanged to "The list order is chosen in the Filter and sort sheet". Tests that open the "Sort" dialog or read the "Sort: …" button open the Filter and sort sheet and read the order text instead.
