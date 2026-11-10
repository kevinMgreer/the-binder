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
The system SHALL show each card as one row with its photo thumbnail, player name, "year set #number", and the parallel, grade and quantity where present, and SHALL NOT truncate the player name or the card number while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the thumbnail, the player, "year set #number", and its parallel, grade and quantity when it has them

#### Scenario: Long names
- **WHEN** a card's set name is longer than the row width
- **THEN** the set name wraps to a second line and the card number stays visible

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
