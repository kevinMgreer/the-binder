## Purpose

Tells the user which card fields must be filled in and, when a save is refused, which ones and where, so a blocked save is never a silent no-op on a long form.

## ADDED Requirements

### Requirement: Required fields are marked before saving
The system SHALL mark the required card fields (player, year, set and card number) as required on the form before the user tries to save.

#### Scenario: Required fields visible on a new card
- **WHEN** the user opens the form to add a card
- **THEN** player, year, set and card number are each labelled as required and no other field is

### Requirement: A blocked save explains itself where the user is looking
The system SHALL, when a save is refused for missing or invalid fields, name those fields next to the Save button and move the user to the first of them.

#### Scenario: Save refused with the Save button in view
- **WHEN** the user taps Save with the player and set fields empty
- **THEN** the card is not saved, a message next to Save names "Player" and "Set", and the first missing field is brought into view and focused

#### Scenario: Message clears once fixed
- **WHEN** the user fixes every named field and taps Save
- **THEN** the card is saved and the message is gone
