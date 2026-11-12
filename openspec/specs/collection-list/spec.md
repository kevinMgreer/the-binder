# collection-list Specification

## Purpose
Defines what the collection list screen shows so a card can be found and a new one added quickly, with the sync state always visible.

## Requirements

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

### Requirement: Sync state is always visible
The system SHALL show the sync state on the title row of the dashboard and the collection list, between the title and the Settings gear, as the state dot and a short word at label size, covering every state `SyncIndicator` has: "Syncing…", "Sync problem", "Sync paused", "Waiting for your choice", "Synced", and "Unsynced: N" with the pending count. It SHALL be a status region (`role="status"`) so a screen reader announces it. In the error state the full wording "Sync problem, retrying (N unsynced)" (without the count when nothing is pending) SHALL show whole, in the danger colour at body size, on a full-width line under the title rule; that line is plain text and not a second live region, so an error is announced once. The Sign in again button and the missing-file choice SHALL appear beneath the title row while their state lasts.

#### Scenario: Each state in words
- **WHEN** the sync state is any of those six
- **THEN** the title row shows its short wording (for example "Synced", "Sync problem" or "Unsynced: 3"), not colour alone

#### Scenario: Beside the gear
- **WHEN** the dashboard or the collection list is shown on a 360 by 800 phone with the sync state "Synced"
- **THEN** the sync state sits on the same row as the level-one heading and the gear, left of the gear, and no separate line beneath the title holds it

#### Scenario: Long wording is not cut
- **WHEN** the sync state is "error" with 3 unsynced changes on a 360 by 800 phone
- **THEN** the title row shows "Sync problem" and the line under the title rule shows "Sync problem, retrying (3 unsynced)" whole, on at most two lines, in the danger colour, and the title and gear keep their size

#### Scenario: Screen reader
- **WHEN** the sync state changes from "Syncing…" to "Synced", or to the error state
- **THEN** the title-row element has `role="status"` and its accessible text is the new short wording, and the line under the title rule has no role of its own

### Requirement: Each card is a ruled row
The system SHALL show each card as one fixed-height row of 100 dp on the ground colour, separated from the next row by a 1 px rule, with no box, gradient or shadow of its own, holding its photo thumbnail in a trading-card frame and two lines: the player name in bold with the serial tag as a small stamp at the right end of the same line, and one quiet line "year set · #number" that continues with the parallel, grade and quantity as plain text where present. A card with no number SHALL show "year set" with no "· #" part. The thumbnail SHALL take the front photo's own orientation: a photo wider than tall is shown in a landscape frame, a photo taller than wide in a portrait frame, always the whole photo with no cropping, inside a fixed square slot as tall as a portrait frame, so every row keeps the same height and the text column starts at the same place. The orientation SHALL come from the photo itself, so photos saved before this rule show correctly without being saved again; a card with no photo, or whose thumbnail has not loaded, SHALL show the portrait placeholder frame. The quiet line SHALL stay on one line; when it does not fit, the parallel, grade and quantity are cut with an ellipsis first, then the set, and the card number SHALL NOT be truncated while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the framed thumbnail, the player in bold with the tag stamp at the right, and one quiet line with "year set · #number" followed by its parallel, grade and quantity when it has them

#### Scenario: Row without a number
- **WHEN** a card with no card number is listed
- **THEN** its quiet line reads "year set" with no "#" and no dangling separator

#### Scenario: Ruled, not boxed
- **WHEN** two cards are listed one above the other, in the light and in the dark theme
- **THEN** each row is 100 dp high, a 1 px rule separates them, and neither row has a background gradient, a translucent background or a shadow

#### Scenario: Landscape photo
- **GIVEN** a card whose front photo is wider than tall
- **WHEN** it is listed
- **THEN** its thumbnail is wider than tall, its width-to-height ratio matches the photo's within 2 percent (nothing cropped), and its row is as tall as a row with a portrait photo

#### Scenario: Portrait photo
- **GIVEN** a card whose front photo is taller than wide
- **WHEN** it is listed
- **THEN** its thumbnail is taller than wide and matches the photo's ratio within 2 percent

#### Scenario: Photo saved earlier
- **GIVEN** a landscape photo saved before this change
- **WHEN** the card is listed
- **THEN** its thumbnail is shown landscape, with no re-save or migration

#### Scenario: No photo
- **WHEN** a card without a front photo is listed
- **THEN** its row shows a portrait placeholder frame in the same slot

#### Scenario: Text column aligned
- **WHEN** a landscape-photo card and a portrait-photo card are listed one above the other
- **THEN** their player names start at the same horizontal position

#### Scenario: Long extras
- **WHEN** a card has a long parallel name, a grade and a quantity above one
- **THEN** the quiet line stays one line high, the extras are cut with an ellipsis, and the card number stays visible

#### Scenario: Long names
- **WHEN** a card's set name is longer than the row width
- **THEN** the set name is cut with an ellipsis on its one line and the card number stays visible

### Requirement: Serial-numbered cards stand out
The system SHALL mark a card marked serial-numbered with its existing serial label (for example 13/150, or ?/99 when the serial is unreadable) as a stamp: ink text in the slab face with tabular figures inside a 1 px ink outline, on the list row and on the card detail screen, and SHALL NOT show a tag on a card that is not serial-numbered, even when it has a print run. A card saved before the mark existed counts as serial-numbered when it has a serial number or a print run. The stamp is ink with an ink outline, SHALL NOT be filled, and is never drawn in the danger red.

#### Scenario: Tag on a serial-numbered card
- **WHEN** a serial-numbered card with serial 13 and print run 150 is listed
- **THEN** its row shows the stamp 13/150 in ink with an ink outline, as readable text

#### Scenario: Unreadable serial
- **WHEN** a serial-numbered card has print run 99 and an unreadable serial number
- **THEN** its row shows the tag ?/99

#### Scenario: No tag otherwise
- **WHEN** a card is not serial-numbered
- **THEN** its row shows no tag and no empty space reserved for one

#### Scenario: Print run only
- **WHEN** a card has print run 99 and is not marked serial-numbered
- **THEN** its row and detail screen show no tag, and the dashboard Serial-numbered tile does not count it

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

### Requirement: Sheets clear the system bars
The system SHALL keep every sheet and its pinned buttons above the system navigation or gesture bar, using the bottom safe-area inset (the Capacitor `--safe-area-inset-bottom` variable or `env(safe-area-inset-bottom)`, whichever is larger, the same inset `#root` uses) plus a 16 dp gap.

#### Scenario: Sheet above a bottom bar
- **WHEN** the Filter sheet is open and the bottom inset is 48 dp
- **THEN** the sheet's last button ends at least 64 dp above the bottom edge of the screen

### Requirement: The card detail screen is a tidy fact sheet
The system SHALL lay the card detail screen out, top to bottom, as: the player as a large title in the slab face with the serial stamp beside it, a 1 px rule, a quiet subtitle "year set · #number" (just "year set" for a card with no number), a plain list of facts separated by 1 px rules with the label in uppercase label type at the left and the value right-aligned (Manufacturer, Team, Parallel, Condition or grade, Quantity, and Traits when set, only those the card has), a strip of photo thumbnails in trading-card frames, a muted last-edited line, Edit as a full-width primary button, and Delete set apart below a rule. The list SHALL NOT sit in a box.

#### Scenario: Fact list
- **WHEN** a card with a team, a serial-numbered parallel, a grade and quantity 3 is opened
- **THEN** the title has the stamp beside it, the subtitle follows, then the ruled facts, then the framed photo strip, then the last-edited line, and Edit is below that at the full width, with Edit and Delete still visible at 360 by 800 on a card with two photos

#### Scenario: Detail without a number
- **WHEN** a card with no card number is opened
- **THEN** the subtitle reads "year set" with no "#"

#### Scenario: Photo strip framed
- **WHEN** a card with a portrait front photo and a landscape back photo is opened
- **THEN** the front sits in a portrait trading-card frame and the back in a landscape one, and tapping either opens the zoom view

#### Scenario: Two landscape photos fit the row
- **WHEN** a card with a landscape front and a landscape back photo is opened on a 360 by 800 phone
- **THEN** the two frames sit side by side inside the row without overlapping, each keeping the 3.5 by 2.5 ratio

### Requirement: The list returns to the dashboard
The system SHALL return from the collection list to the dashboard when the user presses the Android back button (the list has no on-screen Back control), and SHALL keep the list's search and filters while the user opens a card and comes back.

#### Scenario: Back to the dashboard
- **WHEN** the collection list is showing and the user presses back
- **THEN** the dashboard is shown, and the list header has no Back button

#### Scenario: Filters survive opening a card
- **GIVEN** the list is filtered to Autograph
- **WHEN** the user opens a card and goes back
- **THEN** the list is still filtered to Autograph with its chip showing

### Requirement: The first screen holds with the bottom navigation
The system SHALL keep the collection list's first screen usable with the bottom navigation bar: the "Cards" title, the sync state, the gear, the search field, the Filter button and the Sort button visible without scrolling, and at least three full card rows inside the list scroller. The list scroller SHALL end at least 8 dp above the top of the bottom navigation bar, so the last row can scroll clear of the bar.

#### Scenario: First screen with the bar
- **WHEN** the collection screen opens on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing
- **THEN** the "Cards" title, the sync state, the Settings gear, the search field, the Filter button, the "Showing N" line and the Sort button are in view, the list scroller's bottom is at least 8 dp above the top of the bottom navigation bar, and at least three card rows end above the scroller's bottom

#### Scenario: Last row reachable
- **WHEN** the user scrolls a list of 20 cards to its end
- **THEN** the last row is fully visible above the bottom navigation bar and can be tapped

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
