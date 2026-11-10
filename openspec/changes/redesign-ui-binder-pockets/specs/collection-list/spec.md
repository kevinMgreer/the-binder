## Purpose

Defines what the collection list screen shows so a card can be found and a new one added quickly, with the sync state always visible.

## ADDED Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, the collection count and the sync state in a header, then a search field, then filter chips, then the card list, with Scan card as the single primary button. Add card, Pick from photos, Settings and Sign in again SHALL stay reachable as secondary actions.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the count, the sync state, the search field and the filter chips are visible without scrolling, followed by the first card rows

#### Scenario: Secondary actions stay reachable
- **WHEN** the collection screen is shown
- **THEN** Add card, Pick from photos, Settings and (when the session needs it) Sign in again are each reachable in one tap, and only Scan card is drawn as the primary button

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
The system SHALL show one chip per filter group (including Year); a chip whose filter has a value SHALL be in the accent colour and expose `aria-pressed="true"`, and the list SHALL show how many cards match.

#### Scenario: Filter applied
- **WHEN** the user sets a Year value in the filters
- **THEN** the Year chip shows the accent colour with `aria-pressed="true"` and the header or list shows the number of matching cards

#### Scenario: Chip opens its field
- **WHEN** the user taps a chip
- **THEN** the filter panel opens at that group's existing labelled fields
