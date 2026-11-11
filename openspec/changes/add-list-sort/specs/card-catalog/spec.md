## MODIFIED Requirements

### Requirement: Card record
The system SHALL record for each card: player, year, manufacturer, set and team, plus optional sort name, card number, parallel name, serial-numbered mark, serial number, print run, rookie/autograph/relic flags, grading company and grade, raw condition, quantity, notes and front/back photos.

#### Scenario: Minimum card
- **WHEN** the user saves a card with player, year and set
- **THEN** the card is added to the collection and listed

#### Scenario: Card without a number
- **WHEN** the user saves a card with player, year and set and no card number
- **THEN** the card is saved, listed, and opens on its detail screen

#### Scenario: Missing required field
- **WHEN** the user saves a card without player, year or set
- **THEN** the card is not saved and the missing fields are highlighted

#### Scenario: Card with a sort name
- **WHEN** the user saves a card with player "Elly De La Cruz" and sort name "De La Cruz", then opens it for editing
- **THEN** the card is saved and the Sort name field shows "De La Cruz"

### Requirement: List the collection
The system SHALL list cards with a thumbnail, player, year, set, card number and parallel, sorted by player last name by default, then by year, then set, then card number, with a missing card number sorting as empty (before numbered cards of the same set).

#### Scenario: Large collection
- **GIVEN** a collection of 5,000 cards
- **WHEN** the user opens the collection on a mid-range Android phone
- **THEN** the first screen of cards appears within 1 second and scrolling stays smooth

#### Scenario: Numberless card sorts first in its set
- **GIVEN** two cards of the same player, year and set, one with number "5" and one with no number
- **WHEN** the collection is listed by default
- **THEN** the card with no number is listed before the card numbered "5"

## ADDED Requirements

### Requirement: Sort name
The system SHALL offer an optional Sort name field in the card form, directly under Player, not marked required, with the hint "Optional: how this card sorts, e.g. Acuña". A sort name that is blank after trimming SHALL count as none. A card's last-name sort key SHALL be its sort name when it has one; otherwise it SHALL be derived from the player text each time the list is sorted, without changing the stored card:
1. When the card's team is not blank and the player text contains the team (ignoring case and accents), the key is the whole player text.
2. Otherwise, when the player text names several players separated by "/", "&" or the word "and", only the first of them is used.
3. Trailing suffixes "Jr", "Sr", "II", "III" and "IV" are dropped, with or without a period and a comma before them, ignoring case.
4. The key is the last remaining word; when no word remains, it is the whole player text.

A card saved before this field existed SHALL sort by the derived key with no migration or re-save.

#### Scenario: Field in the form
- **WHEN** the user opens the form to add a card
- **THEN** a Sort name field follows the Player field, is not labelled required, is empty, and shows the hint "Optional: how this card sorts, e.g. Acuña"

#### Scenario: Suffix dropped
- **WHEN** a card with player "Ronald Acuña Jr." and no sort name is listed by last name
- **THEN** its sort key is "Acuña", so it is listed before a "Mookie Betts" card

#### Scenario: Numbered suffix dropped
- **WHEN** cards with players "Ken Griffey, Jr." and "Cal Ripken III" and no sort names are listed by last name
- **THEN** their sort keys are "Griffey" and "Ripken"

#### Scenario: One name only
- **WHEN** a card with player "Ichiro" and no sort name is listed by last name
- **THEN** its sort key is "Ichiro"

#### Scenario: Several players
- **WHEN** cards with players "Mike Trout / Shohei Ohtani", "Aaron Judge & Juan Soto" and "Mookie Betts and Freddie Freeman" and no sort names are listed by last name
- **THEN** their sort keys are "Trout", "Judge" and "Betts"

#### Scenario: Team card
- **WHEN** a card with player "Atlanta Braves Team Card", team "Atlanta Braves" and no sort name is listed by last name
- **THEN** its sort key is "Atlanta Braves Team Card"

#### Scenario: Sort name wins
- **GIVEN** a card with player "Elly De La Cruz" and sort name "De La Cruz", and a card with player "Yu Darvish"
- **WHEN** the list is sorted by last name ascending
- **THEN** the Darvish card is listed before the De La Cruz card, although the derived key "Cruz" alone would put De La Cruz first

#### Scenario: Blank sort name
- **WHEN** a card has player "Mookie Betts" and a sort name of only spaces
- **THEN** its sort key is "Betts"

#### Scenario: Card saved before the field
- **GIVEN** a stored card with player "Fernando Tatis Jr." and no sort name field
- **WHEN** the list is sorted by last name
- **THEN** it sorts under "Tatis" and the stored card is unchanged
