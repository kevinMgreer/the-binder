# collection-list Specification

## Purpose
Defines what the collection list screen shows so a card can be found and a new one added quickly, with the sync state always visible.

## Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, a header whose one row holds the title, the sync state and Settings, then one row holding the search field and a Filter button, then the card list. It SHALL NOT show a collection count line (total and distinct cards) on this screen; the dashboard's Cards and Distinct tiles carry those totals, and the "Showing N" line stays. It SHALL offer exactly one add action, a primary "Add card" button fixed above the system bars, which opens the add form.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the sync state, the search field and the Filter button are visible without scrolling, and at least three card rows are visible below them

#### Scenario: No count line
- **WHEN** the collection screen is shown for a collection of 12 cards, 10 of them distinct
- **THEN** no text reading "12 cards, 10 distinct" (or any "N cards, N distinct" line) is shown, and the "Showing 10" line is shown

#### Scenario: One add action
- **WHEN** the collection screen is shown
- **THEN** exactly one Add card button is visible, and tapping it opens the add form

#### Scenario: Sign in again stays reachable
- **WHEN** the session needs a new sign-in
- **THEN** Sign in again is shown in the header area, beneath the title row, in one tap

### Requirement: Sync state is always visible
The system SHALL show the sync state in words on the title row of the dashboard and the collection list, between the title and the Settings gear, covering every state `SyncIndicator` has: syncing, error, paused, needs-decision, synced, and unsynced with the pending count. It SHALL be compact (the state dot and its words at label size, wrapping to a second line rather than being cut when the words do not fit), SHALL keep its wording, and SHALL be a status region (`role="status"`) so a screen reader announces it. The Sign in again button and the missing-file choice SHALL appear beneath the title row while their state lasts.

#### Scenario: Each state in words
- **WHEN** the sync state is any of those six
- **THEN** the title row shows its wording (for example "Synced" or "Unsynced: 3"), not colour alone

#### Scenario: Beside the gear
- **WHEN** the dashboard or the collection list is shown on a 360 by 800 phone with the sync state "Synced"
- **THEN** the sync state sits on the same row as the level-one heading and the gear, left of the gear, and no separate line beneath the title holds it

#### Scenario: Long wording is not cut
- **WHEN** the sync state is "Sync problem, retrying (3 unsynced)" on a 360 by 800 phone
- **THEN** the whole wording is visible on the title row, on at most two lines, and the title and gear keep their size

#### Scenario: Screen reader
- **WHEN** the sync state changes from "Syncing…" to "Synced"
- **THEN** the element holding it has `role="status"` and its accessible text is "Synced"

### Requirement: Each card is a pocket row
The system SHALL show each card as one fixed-height row with its photo thumbnail and two lines: the player name in bold with the serial tag as a small badge at the right end of the same line, and one quiet line "year set · #number" that continues with the parallel, grade and quantity as plain text where present. A card with no number SHALL show "year set" with no "· #" part. The thumbnail SHALL take the front photo's own orientation: a photo wider than tall is shown landscape, a photo taller than wide is shown portrait, always the whole photo with no cropping, inside a fixed square slot as tall as a portrait thumbnail, so every row keeps the same height and the text column starts at the same place. The orientation SHALL come from the photo itself, so photos saved before this rule show correctly without being saved again; a card with no photo, or whose thumbnail has not loaded, SHALL show the portrait placeholder. The quiet line SHALL stay on one line; when it does not fit, the parallel, grade and quantity are cut with an ellipsis first, then the set, and the card number SHALL NOT be truncated while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the thumbnail, the player in bold with the tag badge at the right, and one quiet line with "year set · #number" followed by its parallel, grade and quantity when it has them

#### Scenario: Row without a number
- **WHEN** a card with no card number is listed
- **THEN** its quiet line reads "year set" with no "#" and no dangling separator

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
- **THEN** its row shows a portrait placeholder in the same slot

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
The system SHALL mark a card marked serial-numbered with its existing serial label (for example 13/150, or ?/99 when the serial is unreadable) in the accent colour, on the list row and on the card detail screen, and SHALL NOT show a tag on a card that is not serial-numbered, even when it has a print run. A card saved before the mark existed counts as serial-numbered when it has a serial number or a print run.

#### Scenario: Tag on a serial-numbered card
- **WHEN** a serial-numbered card with serial 13 and print run 150 is listed
- **THEN** its row shows the tag 13/150 in the accent colour, as readable text

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
The system SHALL lay the card detail screen out, top to bottom, as: the player as a large title with the serial tag as a badge beside it in the accent text colour, a quiet subtitle "year set · #number" (just "year set" for a card with no number), a plain list of facts separated by hairline dividers with the label muted at the left and the value right-aligned (Manufacturer, Team, Parallel, Condition or grade, Quantity, and Traits when set, only those the card has), a strip of pocket photo thumbnails, a muted last-edited line, Edit as a full-width primary button, and Delete set apart below a divider. The list SHALL NOT sit in a box.

#### Scenario: Fact list
- **WHEN** a card with a team, a serial-numbered parallel, a grade and quantity 3 is opened
- **THEN** the title has the tag beside it, the subtitle follows, then the ruled facts, then the photo strip, then the last-edited line, and Edit is below that at the full width, with Edit and Delete still visible at 360 by 800 on a card with two photos

#### Scenario: Detail without a number
- **WHEN** a card with no card number is opened
- **THEN** the subtitle reads "year set" with no "#"

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
The system SHALL keep the collection list's first screen usable with the bottom navigation bar and the Add card button above it: the "Cards" title, the sync state, the gear, the search field and the Filter button visible without scrolling, and at least three full card rows inside the list scroller. The list scroller SHALL end at least 8 dp above the top of the Add card button, so the last row can scroll clear of the Add card button and the bar.

#### Scenario: First screen with the bar
- **WHEN** the collection screen opens on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing
- **THEN** the "Cards" title, the sync state, the Settings gear, the search field, the Filter button and the "Showing N" line are in view, the list scroller's bottom is at least 8 dp above the top of the Add card button, and at least three card rows end above the scroller's bottom

#### Scenario: Last row reachable
- **WHEN** the user scrolls a list of 20 cards to its end
- **THEN** the last row is fully visible above the Add card button and can be tapped
