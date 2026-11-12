## MODIFIED Requirements

### Requirement: Sort name
The system SHALL offer an optional Sort name field in the card form, directly under Player, not marked required, with the hint "Follows the player's last name. Change it to sort differently, e.g. De La Cruz". A sort name that is blank after trimming SHALL count as none. A card's last-name sort key SHALL be its sort name when it has one; otherwise it SHALL be derived from the player text each time the list is sorted, without changing the stored card:
1. When the card's team is not blank and the player text contains the team as a whole word (ignoring case and accents), the key is the whole player text.
2. Otherwise, when the player text names several players separated by "/", "&" or the word "and", only the first of them is used.
3. Trailing suffixes "Jr", "Sr", "II", "III" and "IV" are dropped, with or without a period and a comma before them, ignoring case.
4. The key is the last remaining word; when no word remains, it is the whole player text.

A card saved before this field existed SHALL sort by the derived key with no migration or re-save.

In the card form the Sort name field SHALL show the derived key of the current Player and Team text as the user types them, until the user edits Sort name themselves; after that it SHALL keep what they typed when Player or Team change. Clearing Sort name by hand SHALL make it follow again. A card that already has a stored sort name SHALL open with it and never have it replaced automatically. A card SHALL be saved with a sort name only when the field differs from the derived key; otherwise it SHALL be saved with none.

#### Scenario: Field in the form
- **WHEN** the user opens the form to add a card
- **THEN** a Sort name field follows the Player field, is not labelled required, is empty, and shows the hint "Follows the player's last name. Change it to sort differently, e.g. De La Cruz"

#### Scenario: Follows Player
- **WHEN** the user types "Ronald Acuña Jr." into Player
- **THEN** Sort name shows "Acuña"

#### Scenario: Own edit stops following
- **GIVEN** the user typed "Elly De La Cruz" in Player and changed Sort name to "De La Cruz"
- **WHEN** the user changes Player to "Elly De La Cruz Jr."
- **THEN** Sort name still shows "De La Cruz"

#### Scenario: Clearing follows again
- **GIVEN** the user changed Sort name by hand
- **WHEN** the user clears Sort name and then changes Player to "Mookie Betts"
- **THEN** Sort name shows "Betts"

#### Scenario: Stored sort name kept
- **GIVEN** a stored card with player "Elly De La Cruz" and sort name "De La Cruz"
- **WHEN** the user opens it and changes Player to "Elly De la Cruz"
- **THEN** Sort name still shows "De La Cruz"

#### Scenario: Derived value is not stored
- **WHEN** the user saves a card with player "Mookie Betts" and leaves Sort name showing "Betts"
- **THEN** the saved card has no sort name

#### Scenario: Changed value is stored
- **WHEN** the user saves a card with player "Elly De La Cruz" and Sort name "De La Cruz"
- **THEN** the saved card has sort name "De La Cruz"

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
