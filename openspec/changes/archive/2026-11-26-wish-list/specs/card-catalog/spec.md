## ADDED Requirements

### Requirement: Wanted mark
The system SHALL let the user mark a card as wanted: a card the user does not have yet but is looking for. A wanted card SHALL be a normal card record with the same fields, form, validation and sync as an owned card, plus the mark. The card form SHALL show one checkbox labelled "Wanted (I don't have it yet)", unticked for a new card; photos SHALL stay optional, so a wanted card can be saved without any. A card without the mark, including every card and Drive file saved before the mark existed, SHALL count as owned and SHALL load, list, edit and sync as before. The card detail screen of a wanted card SHALL show a "Wanted" tag in text beside the title and a "Mark as owned" action; that action SHALL clear the mark, give the card a new last-edited time, keep every other field as stored, and queue the card for sync. The detail screen of an owned card SHALL show neither. Editing a card SHALL keep its mark unless the user changes the checkbox.

#### Scenario: Add a wanted card without photos
- **WHEN** the user adds a card with player, year and set, ticks "Wanted (I don't have it yet)", takes no photo and saves
- **THEN** the card is saved as wanted and its detail screen shows a "Wanted" tag and a "Mark as owned" action

#### Scenario: Old card counts as owned
- **GIVEN** a Drive file written before the Wanted mark existed, whose cards have no wanted field
- **WHEN** the app syncs and loads it
- **THEN** every card loads, passes validation and counts as owned

#### Scenario: Mark as owned
- **GIVEN** a wanted card with notes "card show" and quantity 1
- **WHEN** the user opens it and taps "Mark as owned"
- **THEN** the card is owned, its notes and quantity are unchanged, its last-edited time is new, it is queued for sync, and the "Wanted" tag and "Mark as owned" action are gone

#### Scenario: Edit keeps the mark
- **GIVEN** a wanted card
- **WHEN** the user edits its notes and saves without touching the Wanted checkbox
- **THEN** the card is still wanted

#### Scenario: The mark survives sync
- **GIVEN** a wanted card saved on this device
- **WHEN** the app syncs with Drive and the collection is later restored from Drive on a fresh install
- **THEN** the restored card is still wanted

## MODIFIED Requirements

### Requirement: Quantity of duplicates
The system SHALL track how many identical copies the user owns as a quantity on one card record rather than as separate cards. A card with no number matches on its other fields with the number treated as empty, and the match only offers to increase the quantity: it SHALL NOT merge cards without the user's choice. The duplicate check SHALL compare owned cards only: adding a wanted card SHALL NOT offer to increase a quantity, and a wanted card SHALL NOT be offered as the card whose quantity is increased.

#### Scenario: Add a duplicate
- **WHEN** the user adds a card whose player, year, set, card number, parallel and grade match an existing card
- **THEN** the system offers to increase the existing card's quantity instead of creating a new card

#### Scenario: Duplicate without a number
- **WHEN** the user adds a card with no number whose player, year, set, parallel and grade match an existing card that also has no number
- **THEN** the system offers to increase the quantity or add it as a separate card, and nothing is merged until the user chooses

#### Scenario: Wanted cards are not duplicates
- **GIVEN** a wanted card for player "Elly De La Cruz", 2023, set "Chrome", number "1"
- **WHEN** the user adds an owned card with the same player, year, set and number, and later adds a wanted card matching an owned card
- **THEN** both saves go through without a duplicate offer, and no quantity changes
