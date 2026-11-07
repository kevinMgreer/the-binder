# Spec Delta

## Purpose

Defines what the app records about each baseball card and how the owner adds, edits, removes and finds cards in the collection.

## ADDED Requirements

### Requirement: Card record
The system SHALL record for each card: player, year, manufacturer, set, card number and team, plus optional parallel name, serial number, print run, rookie/autograph/relic flags, grading company and grade, raw condition, quantity, notes and front/back photos.

#### Scenario: Minimum card
- **WHEN** the user saves a card with player, year, set and card number
- **THEN** the card is added to the collection

#### Scenario: Missing required field
- **WHEN** the user saves a card without player, year, set or card number
- **THEN** the card is not saved and the missing fields are highlighted

### Requirement: Serial-numbered parallels
The system SHALL store a parallel's serial number and print run separately (for example 23 and 2026 for "23/2026"), and SHALL allow the serial number to be recorded as unreadable while keeping the print run.

#### Scenario: Readable serial number
- **WHEN** the user enters serial "23" and print run "2026"
- **THEN** the card displays "23/2026"

#### Scenario: Unreadable serial number
- **WHEN** the user marks the serial number as unreadable and enters print run "99"
- **THEN** the card displays "?/99" and is included when filtering by print run 99

#### Scenario: Serial above print run
- **WHEN** the user enters a serial number larger than the print run
- **THEN** the card is not saved and the serial field shows an error

### Requirement: Graded or raw
The system SHALL record a card as either graded (company and grade) or raw (condition), not both.

#### Scenario: Graded card
- **WHEN** the user marks a card graded by PSA with grade 9
- **THEN** the card displays "PSA 9" and raw condition is not shown

### Requirement: Quantity of duplicates
The system SHALL track how many identical copies the user owns as a quantity on one card record rather than as separate cards.

#### Scenario: Add a duplicate
- **WHEN** the user adds a card whose player, year, set, card number, parallel and grade match an existing card
- **THEN** the system offers to increase the existing card's quantity instead of creating a new card

### Requirement: Edit and delete cards
The system SHALL let the user edit any field of a card and delete a card after confirmation.

#### Scenario: Edit a card
- **WHEN** the user changes a card's notes and saves
- **THEN** the collection shows the new notes and the card's last-edited time is updated

#### Scenario: Delete a card
- **WHEN** the user deletes a card and confirms
- **THEN** the card and its photos are removed from the collection

### Requirement: Browse the collection
The system SHALL list cards with a thumbnail, player, year, set, card number and parallel, sorted by year then set then card number by default.

#### Scenario: Large collection
- **GIVEN** a collection of 5,000 cards
- **WHEN** the user opens the collection on a mid-range Android phone
- **THEN** the first screen of cards appears within 1 second and scrolling stays smooth

### Requirement: Search and filter
The system SHALL let the user search by text across player, team, set and notes, and filter by year range, team, set, parallel, serial-numbered, rookie, autograph, relic and graded.

#### Scenario: Text search
- **WHEN** the user types "acuna"
- **THEN** cards for Ronald Acuña Jr. are listed, ignoring case and accents

#### Scenario: Combined filters
- **WHEN** the user filters team "Atlanta Braves", serial-numbered, years 2020–2026
- **THEN** only cards matching all three filters are listed, with a count

### Requirement: Collection summary
The system SHALL show the total number of cards (counting quantity) and the number of distinct cards.

#### Scenario: Totals with duplicates
- **GIVEN** two distinct cards, one with quantity 3
- **WHEN** the user views the collection
- **THEN** the summary shows 4 cards, 2 distinct
