## MODIFIED Requirements

### Requirement: Card record
The system SHALL record for each card: player, year, manufacturer, set and team, plus optional card number, parallel name, serial-numbered mark, serial number, print run, rookie/autograph/relic flags, grading company and grade, raw condition, quantity, notes and front/back photos.

#### Scenario: Minimum card
- **WHEN** the user saves a card with player, year and set
- **THEN** the card is added to the collection and listed

#### Scenario: Card without a number
- **WHEN** the user saves a card with player, year and set and no card number
- **THEN** the card is saved, listed, and opens on its detail screen

#### Scenario: Missing required field
- **WHEN** the user saves a card without player, year or set
- **THEN** the card is not saved and the missing fields are highlighted

### Requirement: Serial-numbered parallels
The system SHALL let the user enter a print run whether or not the card is marked serial-numbered. It SHALL store a serial-numbered card's serial number and print run separately (for example 23 and 2026 for "23/2026"), and SHALL allow the serial number to be recorded as unreadable while keeping the print run. The serial number fields SHALL be offered only while the card is marked serial-numbered. A card saved before the mark existed counts as serial-numbered when it has a serial number or a print run.

#### Scenario: Readable serial number
- **WHEN** the user marks the card serial-numbered and enters serial "23" and print run "2026"
- **THEN** the card displays "23/2026"

#### Scenario: Unreadable serial number
- **WHEN** the user marks the card serial-numbered, marks the serial number as unreadable and enters print run "99"
- **THEN** the card displays "?/99" and is included when filtering by print run 99

#### Scenario: Print run without serial-numbered
- **WHEN** the user enters print run "99" and does not mark the card serial-numbered
- **THEN** the card is saved, shows no serial label, is included when filtering by print run 99 and is not included when filtering by serial-numbered

#### Scenario: Serial fields hidden
- **WHEN** the card is not marked serial-numbered
- **THEN** the form shows no Serial field and no "Serial unreadable" checkbox, and shows Print run

#### Scenario: Card saved before the mark
- **GIVEN** a stored card with print run 99 and no serial-numbered mark
- **WHEN** it is listed
- **THEN** it shows "?/99" or its serial as before and matches the serial-numbered filter

#### Scenario: Serial above print run
- **WHEN** the user enters a serial number larger than the print run
- **THEN** the card is not saved and the serial field shows an error

### Requirement: Quantity of duplicates
The system SHALL track how many identical copies the user owns as a quantity on one card record rather than as separate cards. A card with no number matches on its other fields with the number treated as empty, and the match only offers to increase the quantity: it SHALL NOT merge cards without the user's choice.

#### Scenario: Add a duplicate
- **WHEN** the user adds a card whose player, year, set, card number, parallel and grade match an existing card
- **THEN** the system offers to increase the existing card's quantity instead of creating a new card

#### Scenario: Duplicate without a number
- **WHEN** the user adds a card with no number whose player, year, set, parallel and grade match an existing card that also has no number
- **THEN** the system offers to increase the quantity or add it as a separate card, and nothing is merged until the user chooses

### Requirement: List the collection
The system SHALL list cards with a thumbnail, player, year, set, card number and parallel, sorted by year then set then card number by default, with a missing card number sorting as empty (before numbered cards of the same set).

#### Scenario: Large collection
- **GIVEN** a collection of 5,000 cards
- **WHEN** the user opens the collection on a mid-range Android phone
- **THEN** the first screen of cards appears within 1 second and scrolling stays smooth

#### Scenario: Numberless card sorts first in its set
- **GIVEN** two cards of the same year and set, one with number "5" and one with no number
- **WHEN** the collection is listed by default
- **THEN** the card with no number is listed before the card numbered "5"
