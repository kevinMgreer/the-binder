## RENAMED Requirements

- FROM: `### Requirement: Each card is a pocket row`
- TO: `### Requirement: Each card is a ruled row`

## MODIFIED Requirements

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

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, a header whose one row holds the title, the sync state and Settings, then one row holding the search field and a Filter button, then the card list. It SHALL NOT show a collection count line (total and distinct cards) on this screen; the dashboard's Cards and Distinct tiles carry those totals, and the "Showing N" line stays. It SHALL offer exactly one add action, the Add item of the bottom navigation (named "Add card"), which opens the add form.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the sync state, the search field and the Filter button are visible without scrolling, and at least three card rows are visible below them

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
The system SHALL keep the collection list's first screen usable with the bottom navigation bar: the "Cards" title, the sync state, the gear, the search field and the Filter button visible without scrolling, and at least three full card rows inside the list scroller. The list scroller SHALL end at least 8 dp above the top of the bottom navigation bar, so the last row can scroll clear of the bar.

#### Scenario: First screen with the bar
- **WHEN** the collection screen opens on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing
- **THEN** the "Cards" title, the sync state, the Settings gear, the search field, the Filter button and the "Showing N" line are in view, the list scroller's bottom is at least 8 dp above the top of the bottom navigation bar, and at least three card rows end above the scroller's bottom

#### Scenario: Last row reachable
- **WHEN** the user scrolls a list of 20 cards to its end
- **THEN** the last row is fully visible above the bottom navigation bar and can be tapped
