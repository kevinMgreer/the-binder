# card-catalog Specification

## Purpose
Defines what the app records about each baseball card and how the owner adds, edits, removes and finds cards in the collection.

## Requirements

### Requirement: Subset and insert
The system SHALL record for each card an optional subset and an optional insert, next to its set, and the card detail screen SHALL show the subset and insert when they are filled in.

#### Scenario: Subset and insert
- **WHEN** the user saves a card with set "Topps", subset "Future Stars" and insert "Stars of MLB"
- **THEN** the card detail screen shows "Future Stars" as the subset and "Stars of MLB" as the insert

#### Scenario: Subset and insert are optional
- **WHEN** the user saves a card leaving subset and insert empty
- **THEN** the card is saved and the detail screen shows no subset or insert line

### Requirement: Raw condition picklist
The system SHALL let the user pick a raw card's condition from the list Mint, Near Mint, Excellent, Very Good, Good, Fair, Poor, or leave it unset; a graded card keeps its free-text grading company and grade. A condition saved before this list existed SHALL be kept: if it equals a list entry ignoring case it is shown as that entry, otherwise it is offered as its own choice and saved unchanged unless the user picks another.

#### Scenario: Pick a condition
- **WHEN** the user adds a raw card and opens the condition field
- **THEN** the choices are Not set, Mint, Near Mint, Excellent, Very Good, Good, Fair and Poor, and the picked one is saved and shown on the card

#### Scenario: Legacy condition matching a list entry
- **GIVEN** a raw card saved with condition "near mint"
- **WHEN** the user opens it in the edit form
- **THEN** the condition field shows Near Mint selected

#### Scenario: Legacy condition not on the list
- **GIVEN** a raw card saved with condition "Sharp corners, off-center"
- **WHEN** the user opens it in the edit form, changes only the notes and saves
- **THEN** the condition field offered "Sharp corners, off-center" as the selected choice, and the saved card still has that condition

#### Scenario: Graded card keeps free-text grade
- **WHEN** the user marks a card graded by PSA with grade 9
- **THEN** the grading company and grade are free-text fields and no condition picklist is shown

### Requirement: Filters ignore case; subset, insert and manufacturer filters
The system SHALL include subset and insert in the text search, SHALL offer manufacturer, subset and insert filters alongside the existing filters, and SHALL match the team, manufacturer, set, subset, insert and parallel filters against a card's value ignoring case and accents.

#### Scenario: Search finds a subset or insert
- **WHEN** the user types "future stars"
- **THEN** cards whose subset or insert is "Future Stars" are listed

#### Scenario: Filter ignores case
- **GIVEN** one card with team "Atlanta Braves" and one with team "atlanta braves"
- **WHEN** the user filters team "Atlanta Braves"
- **THEN** both cards are listed

#### Scenario: Filter by insert
- **WHEN** the user filters insert "Stars of MLB"
- **THEN** only cards with that insert are listed, and an Insert chip is shown

#### Scenario: Filter by manufacturer
- **WHEN** the user filters manufacturer "Topps"
- **THEN** only cards whose manufacturer is "Topps", ignoring case and accents, are listed, and a Manufacturer chip is shown

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

### Requirement: List the collection
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
The system SHALL show the total number of cards (counting quantity) and the number of distinct cards on the dashboard's Cards and Distinct tiles, not as a summary line on the collection list.

#### Scenario: Totals with duplicates
- **GIVEN** two distinct cards, one with quantity 3
- **WHEN** the user views the dashboard
- **THEN** the Cards tile reads 4 and the Distinct tile reads 2
