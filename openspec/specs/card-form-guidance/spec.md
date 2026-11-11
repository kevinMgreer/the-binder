# card-form-guidance Specification

## Purpose
Tells the user which card fields must be filled in and, when a save is refused, which ones and where, so a blocked save is never a silent no-op on a long form.

## Requirements

### Requirement: Required fields are marked before saving
The system SHALL mark the required card fields (player, year and set) as required on the form before the user tries to save. Card number is not required.

#### Scenario: Required fields visible on a new card
- **WHEN** the user opens the form to add a card
- **THEN** player, year and set are each labelled as required and no other field is

### Requirement: A blocked save leads the user to the problem
The system SHALL, when a save is refused for missing or invalid fields, bring the first of those fields into view and focus it with its error showing, and SHALL name all of the fields in a message next to the Save button.

#### Scenario: Save refused
- **WHEN** the user taps Save with the player and set fields empty
- **THEN** the card is not saved, the Player field is brought into view and focused with its error showing, and a message next to Save names "Player" and "Set"

#### Scenario: Message clears once fixed
- **WHEN** the user fixes every named field and taps Save
- **THEN** the card is saved and the message is gone
