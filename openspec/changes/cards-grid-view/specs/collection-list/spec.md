## MODIFIED Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, a header whose one row holds the title, the sync state and Settings, then one row holding the search field and a Filter button, then the "Showing N" line with the List / Grid view toggle and, at its right end, the Sort button, then the cards in the chosen view. It SHALL NOT show a collection count line (total and distinct cards) on this screen; the dashboard's Cards and Distinct tiles carry those totals, and the "Showing N" line stays. It SHALL offer exactly one add action, the Add item of the bottom navigation (named "Add card"), which opens the add form.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the sync state, the search field, the Filter button, the view toggle and the Sort button are visible without scrolling, and at least three card rows are visible below them

#### Scenario: Sort button shares the Showing line
- **WHEN** the collection screen is shown on a 360 by 800 phone
- **THEN** the Sort button's top and bottom lie within the vertical extent of the "Showing N" line's row, at its right end, so it adds no row of its own

#### Scenario: Toggle shares the Showing line
- **WHEN** the collection screen is shown on a 360 by 800 phone for 5,000 cards with the order "Sort: Last name ↑"
- **THEN** the List view and Grid view buttons lie within the vertical extent of the "Showing N" line's row, left of the Sort button, no two of the "Showing N" text, the toggle and the Sort button overlap, and none of them extends past the screen's content edge

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
The system SHALL keep the collection list's first screen usable with the bottom navigation bar: the "Cards" title, the sync state, the gear, the search field, the Filter button, the view toggle and the Sort button visible without scrolling, and inside the scroller at least three full card rows in List view, or at least two full rows of tiles in Grid view. The scroller SHALL end at least 8 dp above the top of the bottom navigation bar, so the last row can scroll clear of the bar.

#### Scenario: First screen with the bar
- **WHEN** the collection screen opens on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing
- **THEN** the "Cards" title, the sync state, the Settings gear, the search field, the Filter button, the "Showing N" line, the view toggle and the Sort button are in view, the list scroller's bottom is at least 8 dp above the top of the bottom navigation bar, and at least three card rows end above the scroller's bottom

#### Scenario: First screen in Grid view
- **WHEN** the collection screen opens in Grid view on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing, for 12 cards
- **THEN** the same controls are in view, the scroller's bottom is at least 8 dp above the top of the bottom navigation bar, and at least six tiles (two rows of three) end above the scroller's bottom

#### Scenario: Last row reachable
- **WHEN** the user scrolls a list of 20 cards to its end
- **THEN** the last row is fully visible above the bottom navigation bar and can be tapped

#### Scenario: Last tile reachable
- **WHEN** the user scrolls a grid of 20 cards to its end
- **THEN** the last tile and its caption are fully visible above the bottom navigation bar and the tile can be tapped

### Requirement: The user chooses the list order
The system SHALL let the user order the collection list by Last name, Year, Team or Set, ascending or descending. The Sort button SHALL show the current order as "Sort: <order> ↑" when ascending and "Sort: <order> ↓" when descending, with an accessible name that says the direction in words (for example "Sort: Last name, ascending"), and SHALL be at least 48 dp in height and width. Tapping it SHALL open a bottom sheet named "Sort" that is only as tall as its content (the Filters sheet stays full height), with the four orders as one single choice in one column and Ascending and Descending as a second single choice side by side in one row. Every option row SHALL be at least 48 dp high, the order rows SHALL be of equal height, and the order radios and the Ascending radio SHALL sit on the same left edge. A choice SHALL reorder the list at once; the sheet has exactly one close control, the Close button in its header (it has no footer and no Done button), and it also closes with the back button or a tap on the scrim, and closing it changes nothing further. The order SHALL apply to the cards the search and filters show. Last name uses each card's sort name or the last name derived from its player, as the card catalog defines. Text is compared ignoring case and accents, with numbers inside text compared by value, and an empty value sorts as empty text. Cards equal on the chosen order SHALL follow year, then set, then card number. Descending SHALL list the cards in exactly the reverse of the ascending order. The default order SHALL be Last name ascending. The chosen order SHALL stay while the app runs, including after opening a card, Settings or the dashboard and coming back, and SHALL return to Last name ascending when the app starts fresh; it SHALL NOT be stored on the device or in Drive.

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
- **WHEN** the user opens Sort, picks Team, and taps Close (the scenario keeps its old name because `openspec validate` matches scenarios by name; rename it to "Close closes the sheet and keeps the choice" when the change is archived)
- **THEN** the Sort sheet is closed, the list is in Team order and the Sort button reads "Sort: Team ↑"

#### Scenario: Close is the only close control
- **WHEN** the Sort sheet is open
- **THEN** its header has a Close button, no button named Done exists in the sheet, and the sheet has no footer

#### Scenario: The Sort sheet does not fill the screen
- **WHEN** the Sort sheet is opened on a 360 by 800 screen with no bottom inset, and then the Filters sheet is opened
- **THEN** the Sort sheet is less than two thirds of the screen height with no empty space between its last option row and its bottom padding, while the Filters sheet still reaches from below the status bar to the bottom of the screen

#### Scenario: Options line up
- **WHEN** the Sort sheet is open at 360 by 800
- **THEN** the Last name, Year, Team and Set rows each are at least 48 dp high and of equal height, the left edges of the four order radios and the Ascending radio are within 1 dp of each other, and Ascending and Descending share one row of the same height with Descending to the right

## ADDED Requirements

### Requirement: The user chooses list or grid view
The system SHALL offer, in the "Showing N" row left of the Sort button, a view toggle of two adjacent icon buttons named "List view" and "Grid view", each at least 48 dp in height and width, in a group named "View". The button of the current view SHALL have `aria-pressed="true"` and look selected (ink fill, ground-coloured icon); the other SHALL have `aria-pressed="false"`. Tapping a button SHALL switch to that view at once, showing the same cards (the same search, filters, chips, "Showing N" count and order) from the top. List view SHALL show the ruled rows the "Each card is a ruled row" requirement describes; Grid view SHALL show the tiles the "The grid shows cards as framed tiles" requirement describes. The empty-collection and no-match messages SHALL be the same in both views, and the toggle SHALL stay shown with them. The default view SHALL be List. The chosen view SHALL be kept on the device, so it is the view shown after opening a card, Settings or the dashboard and coming back, and after the app is closed and started again; it SHALL NOT be stored in Drive. When the device storage cannot be read or written, the app SHALL use List view (or keep the view chosen in this run) and SHALL NOT show an error. Sort keeps its own rule: it is not stored and returns to Last name ascending on a fresh start.

#### Scenario: Default is List
- **GIVEN** the view has never been chosen on this device
- **WHEN** the collection screen opens
- **THEN** the cards are shown as rows, "List view" has `aria-pressed="true"` and "Grid view" has `aria-pressed="false"`

#### Scenario: Switch to Grid
- **WHEN** the user taps "Grid view"
- **THEN** the cards are shown as tiles in the same order, the "Showing N" count is unchanged, "Grid view" has `aria-pressed="true"` and "List view" has `aria-pressed="false"`

#### Scenario: Toggle targets
- **WHEN** the collection screen is shown on a 360 by 800 phone
- **THEN** the "List view" and "Grid view" buttons are each at least 48 dp high and wide

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
- **THEN** the collection screen shows Grid view and the Sort button reads "Sort: Last name ↑"

#### Scenario: Kept while the app runs
- **WHEN** the user picks Grid view, opens a card and goes back, then switches to the dashboard and back to Cards
- **THEN** the collection screen is still in Grid view

#### Scenario: Storage unavailable
- **GIVEN** the device storage throws on every read and write
- **WHEN** the collection screen opens and the user taps "Grid view"
- **THEN** the screen opens in List view, switches to Grid view, and no error is shown

### Requirement: The grid shows cards as framed tiles
The system SHALL show Grid view as a list (`role="list"`) of tiles (`role="listitem"`) in 3 equal columns when the viewport is narrower than 480 dp and 4 equal columns from 480 dp wide, with the screen's gutter at the sides and the frame gap between tiles. Each tile SHALL be one button holding the card's front photo in a portrait trading-card frame that fills the column's width, and under it a caption of exactly two single lines at label size: the player name (cut with an ellipsis when too long) and the year, followed on the same line by a quantity badge "×N" when the card's quantity is above one. A front photo wider than tall SHALL be shown in a landscape frame inside the same portrait-shaped slot, whole and never cropped, so every tile in a row has the same height. A card with no front photo, or whose thumbnail has not loaded, SHALL show the portrait placeholder frame and its caption as usual. The tile SHALL show the stored thumbnail of the front photo only and SHALL NOT download a photo. The tile's accessible name SHALL be the player, then the year and set, then "number N" when the card has a number, then "N copies" when its quantity is above one (for example "Mookie Betts, 2024 Topps Chrome, number 27"). Tapping a tile SHALL open the card's detail screen, as tapping a row does. Tiles SHALL have no gradient, shadow or translucent background, in the light and the dark theme.

#### Scenario: Three columns on a phone
- **GIVEN** Grid view with 7 cards
- **WHEN** the collection screen is shown at 360 by 800
- **THEN** the first three tiles share one top edge and have equal widths within 1 dp, the fourth tile starts a second row at the left edge, and every tile lies inside the screen's gutters

#### Scenario: Four columns on a wider screen
- **GIVEN** Grid view with 9 cards
- **WHEN** the collection screen is shown at 600 by 800
- **THEN** the first four tiles share one top edge and the fifth starts a second row

#### Scenario: Tile content
- **GIVEN** a card "Mookie Betts", 2024 Topps Chrome, number 27, quantity 3, with a portrait front photo
- **WHEN** it is shown in Grid view
- **THEN** its tile shows the photo in a portrait frame with a width-to-height ratio of 2.5 to 3.5 within 2 percent, then the line "Mookie Betts" and the line "2024" with the badge "×3", and its accessible name is "Mookie Betts, 2024 Topps Chrome, number 27, 3 copies"

#### Scenario: Tile without a number
- **WHEN** a card "Ronald Acuña Jr.", 2019 Bowman, with no card number and quantity 1, is shown in Grid view
- **THEN** its accessible name is "Ronald Acuña Jr., 2019 Bowman" and its caption shows no badge

#### Scenario: Landscape photo not cropped
- **GIVEN** a card whose front photo is wider than tall
- **WHEN** it is shown in Grid view beside a card with a portrait photo
- **THEN** its frame is wider than tall, the image keeps the photo's ratio within 2 percent, and both tiles are the same height within 1 dp

#### Scenario: No front photo
- **WHEN** a card without a front photo is shown in Grid view
- **THEN** its tile shows the portrait placeholder frame and its two-line caption with the player name

#### Scenario: Long player name
- **WHEN** a card whose player name is wider than the tile is shown in Grid view
- **THEN** the name stays on one line cut with an ellipsis, and the caption stays two lines high

#### Scenario: Tap opens the card
- **WHEN** the user taps a tile
- **THEN** that card's detail screen opens

#### Scenario: List semantics
- **WHEN** Grid view is shown
- **THEN** the tiles are inside one element with the list role and each tile is inside an element with the listitem role

#### Scenario: Both themes
- **WHEN** Grid view is shown in the light and in the dark theme
- **THEN** no tile has a background gradient, a translucent background or a shadow, and the caption text meets the contrast the app-theme capability requires

### Requirement: The grid stays fast with a large collection
The system SHALL render only the tiles near the visible part of the grid, as the list renders only the rows near its visible part, so a collection of 5,000 cards shows its first tiles as fast as the list shows its first rows and scrolling does not build every tile.

#### Scenario: First tiles within 1 s
- **GIVEN** 5,000 cards, Grid view chosen, and the CPU throttled four times
- **WHEN** the user taps the Cards item of the bottom navigation
- **THEN** the first tiles are shown within 1 s of the tap

#### Scenario: Only nearby tiles exist
- **GIVEN** 5,000 cards in Grid view at 360 by 800
- **WHEN** the grid is shown, and again after scrolling to the middle
- **THEN** fewer than 100 tiles exist in the page each time, and the tiles in view belong to the cards at that position in the order

### Requirement: Back from a card returns to it
The system SHALL, when the user goes back from a card's detail screen to the collection screen it was opened from, show the same view scrolled so the opened card's row or tile is fully in view, and move keyboard and screen-reader focus to it. When that card is no longer shown (it was deleted, or the filters no longer match it), the screen SHALL open at the top with no card focused. Switching the view with the toggle SHALL start the new view at the top.

#### Scenario: Back to a tile far down the grid
- **GIVEN** 200 cards in Grid view
- **WHEN** the user scrolls down, opens the 150th card and presses back
- **THEN** Grid view is shown, the 150th card's tile is fully inside the scroller above the bottom navigation bar, and it has focus

#### Scenario: Back to a row far down the list
- **GIVEN** 200 cards in List view
- **WHEN** the user scrolls down, opens the 150th card and presses back
- **THEN** List view is shown, the 150th card's row is fully inside the scroller, and it has focus

#### Scenario: Deleted card
- **WHEN** the user opens a card from the grid and deletes it
- **THEN** the collection screen shows Grid view at its top, without the deleted card
