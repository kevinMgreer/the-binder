## RENAMED Requirements

- FROM: `### Requirement: Each card is a pocket row`
- TO: `### Requirement: Each card is a ruled row`

## MODIFIED Requirements

### Requirement: Each card is a ruled row
The system SHALL show each card as one fixed-height row of 100 dp on the ground colour, separated from the next row by a 1 px rule, with no box, gradient or shadow of its own, holding its photo thumbnail in a trading-card frame and two lines: the player name in bold with the serial tag as a small stamp at the right end of the same line, and one quiet line "year set · #number" that continues with the parallel, grade and quantity as plain text where present. The thumbnail SHALL take the front photo's own orientation: a photo wider than tall is shown in a landscape frame, a photo taller than wide in a portrait frame, always the whole photo with no cropping, inside a fixed square slot as tall as a portrait frame, so every row keeps the same height and the text column starts at the same place. The orientation SHALL come from the photo itself, so photos saved before this rule show correctly without being saved again; a card with no photo, or whose thumbnail has not loaded, SHALL show the portrait placeholder frame. The quiet line SHALL stay on one line; when it does not fit, the parallel, grade and quantity are cut with an ellipsis first, then the set, and the card number SHALL NOT be truncated while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the framed thumbnail, the player in bold with the tag stamp at the right, and one quiet line with "year set · #number" followed by its parallel, grade and quantity when it has them

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
The system SHALL mark a serial-numbered card with its existing serial label (for example 13/150, or ?/99 when the serial is unreadable) as a stamp: ink text in the slab face with tabular figures inside a 1 px ink outline, on the list row and on the card detail screen, and SHALL NOT show a tag on a card without a serial number. The stamp SHALL NOT be filled with gold or drawn in the stitch colour.

#### Scenario: Tag on a serial-numbered card
- **WHEN** a card with serial 13 and print run 150 is listed
- **THEN** its row shows the stamp 13/150 in ink with an ink outline, as readable text

#### Scenario: Unreadable serial
- **WHEN** a card has print run 99 and an unreadable serial number
- **THEN** its row shows the tag ?/99

#### Scenario: No tag otherwise
- **WHEN** a card has no serial number
- **THEN** its row shows no tag and no empty space reserved for one

### Requirement: The card detail screen is a tidy fact sheet
The system SHALL lay the card detail screen out, top to bottom, as: the player as a large title in the slab face with the serial stamp beside it, a stitch rule, a quiet subtitle "year set · #number", a plain list of facts separated by 1 px rules with the label in uppercase label type at the left and the value right-aligned (Manufacturer, Team, Parallel, Condition or grade, Quantity, and Traits when set, only those the card has), a strip of photo thumbnails in trading-card frames, a muted last-edited line, Edit as a full-width gold primary button, and Delete set apart below a rule. The list SHALL NOT sit in a box.

#### Scenario: Fact list
- **WHEN** a card with a team, a serial-numbered parallel, a grade and quantity 3 is opened
- **THEN** the title has the stamp beside it, the subtitle follows, then the ruled facts, then the framed photo strip, then the last-edited line, and Edit is below that at the full width, with Edit and Delete still visible at 360 by 800 on a card with two photos

#### Scenario: Photo strip framed
- **WHEN** a card with a portrait front photo and a landscape back photo is opened
- **THEN** the front sits in a portrait trading-card frame and the back in a landscape one, and tapping either opens the zoom view

### Requirement: Sync state is always visible
The system SHALL show the sync state on the title row of the dashboard and the collection list, between the title and the Settings gear, as the state dot and a short word at label size, covering every state `SyncIndicator` has: "Syncing…", "Sync problem", "Sync paused", "Waiting for your choice", "Synced", and "Unsynced: N" with the pending count. It SHALL be a status region (`role="status"`) so a screen reader announces it. In the error state the full wording "Sync problem, retrying (N unsynced)" (without the count when nothing is pending) SHALL show whole, in the danger colour at body size, on a full-width line under the stitch; that line is plain text and not a second live region, so an error is announced once. The Sign in again button and the missing-file choice SHALL appear beneath the title row while their state lasts.

#### Scenario: Each state in words
- **WHEN** the sync state is any of those six
- **THEN** the title row shows its short wording (for example "Synced", "Sync problem" or "Unsynced: 3"), not colour alone

#### Scenario: Beside the gear
- **WHEN** the dashboard or the collection list is shown on a 360 by 800 phone with the sync state "Synced"
- **THEN** the sync state sits on the same row as the level-one heading and the gear, left of the gear, and no separate line beneath the title holds it

#### Scenario: Long wording is not cut
- **WHEN** the sync state is "error" with 3 unsynced changes on a 360 by 800 phone
- **THEN** the title row shows "Sync problem" and the line under the stitch shows "Sync problem, retrying (3 unsynced)" whole, on at most two lines, in the danger colour, and the title and gear keep their size

#### Scenario: Screen reader
- **WHEN** the sync state changes from "Syncing…" to "Synced", or to the error state
- **THEN** the title-row element has `role="status"` and its accessible text is the new short wording, and the line under the stitch has no role of its own
