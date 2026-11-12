# collection-list Specification

## Purpose
Defines what the collection list screen shows so a card can be found and a new one added quickly, with the sync state always visible.

## Requirements

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
The system SHALL show each card as one fixed-height row of 112 dp on the ground colour, separated from the next row by a 1 px rule, with no box, gradient or shadow of its own, holding its photo thumbnail in a trading-card frame and two lines: the player name in bold with the serial tag as a small stamp at the right end of the same line, and one quiet line "year set · #number" that continues with the parallel, grade and quantity as plain text where present. A card with no number SHALL show "year set" with no "· #" part. The thumbnail SHALL take the front photo's own orientation: a photo wider than tall is shown in a landscape frame, a photo taller than wide in a portrait frame, always the whole photo with no cropping, inside a fixed 96 dp square slot as tall as a portrait frame, so every row keeps the same height and the text column starts at the same place. The stored thumbnail SHALL be shown as it is, with no re-generation. The orientation SHALL come from the photo itself, so photos saved before this rule show correctly without being saved again; a card with no photo, or whose thumbnail has not loaded, SHALL show the portrait placeholder frame. The quiet line SHALL stay on one line; when it does not fit, the parallel, grade and quantity are cut with an ellipsis first, then the set, and the card number SHALL NOT be truncated while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the framed thumbnail, the player in bold with the tag stamp at the right, and one quiet line with "year set · #number" followed by its parallel, grade and quantity when it has them

#### Scenario: Row without a number
- **WHEN** a card with no card number is listed
- **THEN** its quiet line reads "year set" with no "#" and no dangling separator

#### Scenario: Ruled, not boxed
- **WHEN** two cards are listed one above the other, in the light and in the dark theme
- **THEN** each row is 112 dp high, a 1 px rule separates them, and neither row has a background gradient, a translucent background or a shadow

#### Scenario: Bigger thumbnail
- **WHEN** a card with a portrait front photo is listed
- **THEN** its framed thumbnail is 96 dp tall within 2 dp

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

### Requirement: Sheets clear the system bars
The system SHALL keep every sheet and its pinned buttons above the system navigation or gesture bar, using the bottom safe-area inset (the Capacitor `--safe-area-inset-bottom` variable or `env(safe-area-inset-bottom)`, whichever is larger, the same inset `#root` uses) plus a 16 dp gap.

#### Scenario: Sheet above a bottom bar
- **WHEN** the Filter and sort sheet is open and the bottom inset is 48 dp
- **THEN** the sheet's last button ends at least 64 dp above the bottom edge of the screen

### Requirement: The card detail screen is a tidy fact sheet
The system SHALL lay the card detail screen out, top to bottom, as: a header block, a 1 px rule, a plain list of facts, the photos, a muted last-edited line and one action row. The header block SHALL hold only the player as a large title in the slab face with the serial stamp beside it on the title's first line (a long name wraps inside the width left of the stamp, and the stamp stays level with the first line), then one quiet muted line "year set · #number" (just "year set" for a card with no number). Both lines SHALL start at the content's left edge and the header SHALL have no minimum height of its own, but it SHALL breathe: at least 16 dp from the top of the screen content to the title, 8 dp between the title and the quiet line, and 12 dp or more from the quiet line to the rule. The fact list SHALL separate its rows by 1 px rules with the label in uppercase label type at the left and the value right-aligned (Manufacturer, Subset, Insert, Team, Parallel, Condition or grade, Quantity, and Traits when set, only those the card has; Team and Parallel are rows like the others, not a second line under the title), and SHALL NOT sit in a box. The photos SHALL be shown in trading-card frames as the `card-photos` capability describes. The action row SHALL hold Delete at the left as a danger-outlined button (danger text and border, transparent background) and Edit at the right as the filled primary button, both real buttons of the same height, width share and radius.

#### Scenario: Fact list
- **WHEN** a card with a team, a serial-numbered parallel, a grade and quantity 3 is opened
- **THEN** the title has the stamp beside it and the quiet line follows, then the rule, the ruled facts (including Team and Parallel rows), the framed photos and the last-edited line, and the action row with Delete and Edit is below that

#### Scenario: Header breathes
- **WHEN** a card with a team and a parallel is opened on a 360 by 800 phone
- **THEN** the title and the quiet line start at the same x position within 1 dp, the title starts at least 16 dp below the top of the screen content, the gap between the bottom of the title and the top of the quiet line is 8 dp within 2 dp, and the gap from the quiet line to the rule is at least 12 dp

#### Scenario: Team and Parallel are fact rows
- **WHEN** a card with a team and a parallel name is opened
- **THEN** the header has no third line, and the facts list has Team and Parallel rows in the same style as the other rows

#### Scenario: Long names wrap cleanly
- **WHEN** a card with a very long player name, a long set name, a serial-numbered parallel and a team is opened on a 360 by 800 phone
- **THEN** nothing overflows the width, the name wraps onto further lines left of the stamp, and the stamp is level with the first line of the name

#### Scenario: Detail without a number
- **WHEN** a card with no card number is opened
- **THEN** the quiet line reads "year set" with no "#"

#### Scenario: Photo strip framed
- **WHEN** a card with a portrait front photo and a landscape back photo is opened
- **THEN** the front sits in a portrait trading-card frame and the back in a landscape one, and tapping either opens the zoom view

#### Scenario: Two portrait photos fill the row
- **WHEN** a card with a portrait front and a portrait back photo is opened on a 360 by 800 phone
- **THEN** both frames are 200 dp tall within 4 dp and sit side by side without overlapping

#### Scenario: Two landscape photos fit the row
- **WHEN** a card with a landscape front and a landscape back photo is opened on a 360 by 800 phone
- **THEN** the two frames sit side by side inside the row without overlapping, each keeping the 3.5 by 2.5 ratio

#### Scenario: Actions in one row
- **WHEN** a card with two portrait photos and at most four facts is opened on a 360 by 800 phone with a 24 dp status bar and a 48 dp bottom inset
- **THEN** Delete and Edit are on one row with Delete to the left, both the same width and height, both in view without scrolling, and no other control is below them

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

### Requirement: Delete asks in a centred dialog
The system SHALL, when Delete is tapped on the card detail screen, show a modal dialog (role alertdialog, named "Delete card") centred on the screen over a scrim, with the question "Delete this card?", a Delete button outlined in the danger colour on the left and a Keep button filled as the primary button on the right, of equal width, as the screen's Delete and Edit pair is drawn; Keep has focus when the dialog opens. Delete in the dialog SHALL delete the card as the `card-catalog` capability describes (soft delete, its photos queued for removal from Drive) and leave the detail screen. Keep, a tap on the scrim, Escape and Android back SHALL close the dialog without deleting and return focus to the screen's Delete button; Android back SHALL close the dialog before it leaves the screen. The dialog SHALL be fully visible without scrolling at any scroll position of the detail screen and SHALL sit above the system bars.

#### Scenario: Dialog over the screen
- **GIVEN** the detail screen of a card is scrolled to its end on a 360 by 800 phone
- **WHEN** the user taps Delete
- **THEN** a "Delete card" alertdialog is centred in the viewport with its Delete and Keep buttons in view with Delete on the left, Keep has focus, Keep is filled with the ink colour, and Delete has a danger-coloured border and text on a transparent background, both of equal width within 1 dp

#### Scenario: Confirm deletes
- **WHEN** the user taps Delete and then Delete in the dialog
- **THEN** the card leaves the collection and the screen it was opened from is shown

#### Scenario: Keep keeps the card
- **WHEN** the user taps Delete and then Keep
- **THEN** the dialog closes, the card is unchanged and the Delete button has focus

#### Scenario: Back closes the dialog first
- **WHEN** the user taps Delete and presses Android back
- **THEN** the dialog closes, the detail screen is still shown and the card is unchanged; pressing back again leaves the detail screen

#### Scenario: Scrim tap keeps the card
- **WHEN** the user taps Delete and then taps the scrim outside the dialog
- **THEN** the dialog closes and the card is unchanged

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
