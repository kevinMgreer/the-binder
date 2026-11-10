## Purpose

Defines what the collection list screen shows so a card can be found and a new one added quickly, with the sync state always visible.

## ADDED Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, the collection count and the sync state in a header, then a search field, then filter chips, then the card list, with a single primary Scan card button.

#### Scenario: First screen
- **WHEN** the collection screen opens
- **THEN** the count, the sync state, the search field and the filter chips are visible without scrolling, followed by the first card rows

#### Scenario: Sync state is always visible
- **WHEN** the app is syncing, synced, paused or offline
- **THEN** the header shows that state in words, not colour alone

### Requirement: Each card is a pocket row
The system SHALL show each card as one row with its photo thumbnail, player name, and year, set and card number, and SHALL NOT truncate the player name or the card number while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the thumbnail, the player, and "year set #number" on one or two lines

#### Scenario: Long names
- **WHEN** a card's set name is longer than the row width
- **THEN** the set name wraps to a second line and the card number stays visible

### Requirement: Serial-numbered cards stand out
The system SHALL mark a serial-numbered card with its serial tag (for example 013/150) in the accent colour, on the list row and on the card detail screen, and SHALL NOT show a tag on a card without a serial number.

#### Scenario: Tag on a serial-numbered card
- **WHEN** a card with serial 13 and print run 150 is listed
- **THEN** its row shows the tag 013/150 in the accent colour

#### Scenario: No tag otherwise
- **WHEN** a card has no serial number
- **THEN** its row shows no tag and no empty space reserved for one

### Requirement: The active filter is clear
The system SHALL show an applied filter chip in the accent colour and SHALL show how many cards match.

#### Scenario: Filter applied
- **WHEN** the user applies the Year filter
- **THEN** the Year chip shows the accent colour and the header or list shows the number of matching cards
