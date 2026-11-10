## Purpose

Defines what the collection list screen shows so a card can be found and a new one added quickly, with the sync state always visible.

## ADDED Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, a header with the title, the collection count, the sync state and Settings, then one row holding the search field and a Filter button, then the card list. It SHALL offer exactly one add action, a primary "Add card" button fixed above the system bars, which opens a sheet with Scan card, Pick from photos and Enter by hand.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the count, the sync state, the search field and the Filter button are visible without scrolling, and at least three card rows are visible below them

#### Scenario: One add action
- **WHEN** the collection screen is shown
- **THEN** exactly one add button is visible, and tapping it shows Scan card, Pick from photos and Enter by hand, each reachable in one more tap

#### Scenario: Sign in again stays reachable
- **WHEN** the session needs a new sign-in
- **THEN** Sign in again is shown in the header area in one tap

### Requirement: Sync state is always visible
The system SHALL show the sync state in words in the header, covering every state `SyncIndicator` has: syncing, error, paused, needs-decision, synced, and unsynced with the pending count.

#### Scenario: Each state in words
- **WHEN** the sync state is any of those six
- **THEN** the header shows its wording (for example "Synced" or "Unsynced: 3"), not colour alone

### Requirement: Each card is a pocket row
The system SHALL show each card as one fixed-height row with its photo thumbnail and two lines: the player name in bold with the serial tag as a small badge at the right end of the same line, and one quiet line "year set · #number" that continues with the parallel, grade and quantity as plain text where present. The quiet line SHALL stay on one line; when it does not fit, the parallel, grade and quantity are cut with an ellipsis first, then the set, and the card number SHALL NOT be truncated while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the thumbnail, the player in bold with the tag badge at the right, and one quiet line with "year set · #number" followed by its parallel, grade and quantity when it has them

#### Scenario: Long extras
- **WHEN** a card has a long parallel name, a grade and a quantity above one
- **THEN** the quiet line stays one line high, the extras are cut with an ellipsis, and the card number stays visible

#### Scenario: Long names
- **WHEN** a card's set name is longer than the row width
- **THEN** the set name is cut with an ellipsis on its one line and the card number stays visible

### Requirement: Serial-numbered cards stand out
The system SHALL mark a serial-numbered card with its existing serial label (for example 13/150, or ?/99 when the serial is unreadable) in the accent colour, on the list row and on the card detail screen, and SHALL NOT show a tag on a card without a serial number.

#### Scenario: Tag on a serial-numbered card
- **WHEN** a card with serial 13 and print run 150 is listed
- **THEN** its row shows the tag 13/150 in the accent colour, as readable text

#### Scenario: Unreadable serial
- **WHEN** a card has print run 99 and an unreadable serial number
- **THEN** its row shows the tag ?/99

#### Scenario: No tag otherwise
- **WHEN** a card has no serial number
- **THEN** its row shows no tag and no empty space reserved for one

### Requirement: The active filter is clear
The system SHALL put all filters behind one Filter button that opens a full-height sheet with the existing labelled fields grouped under headings, a Show N cards button and a Clear all button. It SHALL show each applied filter as a removable chip below the search row, show a count badge on the Filter button, and show how many cards match. No chips appear while no filter is applied.

#### Scenario: Filter applied
- **WHEN** the user sets a Year value in the filter sheet and taps Show cards
- **THEN** the sheet closes, a Year chip with a remove control appears below the search row, the Filter button shows a count of 1, and the list shows the number of matching cards

#### Scenario: Remove a filter
- **WHEN** the user taps the remove control on an applied chip
- **THEN** that filter clears and the list updates

#### Scenario: Nothing applied
- **WHEN** no filter is applied
- **THEN** no chip row is shown and the Filter button has no badge

### Requirement: Sheets clear the system bars
The system SHALL keep every sheet and its pinned buttons above the system navigation or gesture bar, using the bottom safe-area inset (the Capacitor `--safe-area-inset-bottom` variable or `env(safe-area-inset-bottom)`, whichever is larger, the same inset `#root` uses) plus a 16 dp gap.

#### Scenario: Sheet above a bottom bar
- **WHEN** the Add card or Filter sheet is open and the bottom inset is 48 dp
- **THEN** the sheet's last button ends at least 64 dp above the bottom edge of the screen

### Requirement: The card detail screen is a tidy fact sheet
The system SHALL lay the card detail screen out, top to bottom, as: the player as a large title with the serial tag as a badge beside it in the accent text colour, a quiet subtitle "year set · #number", a plain list of facts separated by hairline dividers with the label muted at the left and the value right-aligned (Manufacturer, Team, Parallel, Condition or grade, Quantity, and Traits when set, only those the card has), a strip of pocket photo thumbnails, a muted last-edited line, Edit as a full-width primary button, and Delete set apart below a divider. The list SHALL NOT sit in a box.

#### Scenario: Fact list
- **WHEN** a card with a team, a serial-numbered parallel, a grade and quantity 3 is opened
- **THEN** the title has the tag beside it, the subtitle follows, then the ruled facts, then the photo strip, then the last-edited line, and Edit is below that at the full width, with Edit and Delete still visible at 360 by 800 on a card with two photos
