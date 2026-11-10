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
