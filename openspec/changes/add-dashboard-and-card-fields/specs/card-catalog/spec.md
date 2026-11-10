## MODIFIED Requirements

### Requirement: Card record
The system SHALL record for each card: player, year, manufacturer, set, card number and team, plus optional subset, insert, parallel name, serial number, print run, rookie/autograph/relic flags, grading company and grade, raw condition, quantity, notes and front/back photos. The card detail screen SHALL show the subset and insert when they are filled in.

#### Scenario: Minimum card
- **WHEN** the user saves a card with player, year, set and card number
- **THEN** the card is added to the collection

#### Scenario: Missing required field
- **WHEN** the user saves a card without player, year, set or card number
- **THEN** the card is not saved and the missing fields are highlighted

#### Scenario: Subset and insert
- **WHEN** the user saves a card with set "Topps", subset "Future Stars" and insert "Stars of MLB"
- **THEN** the card detail screen shows "Future Stars" as the subset and "Stars of MLB" as the insert

#### Scenario: Subset and insert are optional
- **WHEN** the user saves a card leaving subset and insert empty
- **THEN** the card is saved and the detail screen shows no subset or insert line

### Requirement: Graded or raw
The system SHALL record a card as either graded (company and grade) or raw (condition), not both. A raw card's condition SHALL be picked from the list Mint, Near Mint, Excellent, Very Good, Good, Fair, Poor, or left unset. A condition saved before this list existed SHALL be kept: if it equals a list entry ignoring case it is shown as that entry, otherwise it is offered as its own choice and saved unchanged unless the user picks another.

#### Scenario: Graded card
- **WHEN** the user marks a card graded by PSA with grade 9
- **THEN** the card displays "PSA 9" and raw condition is not shown

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

### Requirement: Search and filter
The system SHALL let the user search by text across player, team, set, subset, insert and notes, and filter by year range, team, manufacturer, set, subset, insert, parallel, serial-numbered, rookie, autograph, relic and graded. The team, manufacturer, set, subset, insert and parallel filters SHALL match a card's value ignoring case and accents.

#### Scenario: Text search
- **WHEN** the user types "acuna"
- **THEN** cards for Ronald Acuña Jr. are listed, ignoring case and accents

#### Scenario: Search finds a subset or insert
- **WHEN** the user types "future stars"
- **THEN** cards whose subset or insert is "Future Stars" are listed

#### Scenario: Combined filters
- **WHEN** the user filters team "Atlanta Braves", serial-numbered, years 2020–2026
- **THEN** only cards matching all three filters are listed, with a count

#### Scenario: Filter ignores case
- **GIVEN** one card with team "Atlanta Braves" and one with team "atlanta braves"
- **WHEN** the user filters team "Atlanta Braves"
- **THEN** both cards are listed

#### Scenario: Filter by insert
- **WHEN** the user filters insert "Stars of MLB"
- **THEN** only cards with that insert are listed, and an Insert chip is shown
