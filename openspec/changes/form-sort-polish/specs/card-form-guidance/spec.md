## ADDED Requirements

### Requirement: Cancel sits left of Save
The system SHALL show the add and edit forms' actions in one row with Cancel first (at the left) and Save last (at the right). Cancel SHALL be the ink-outlined secondary button and Save the primary button, taking the rest of the row. Both SHALL be at least 48 dp high and at least 8 dp apart.

#### Scenario: Button order on the add form
- **WHEN** the add form is shown at 360 by 800
- **THEN** Cancel and Save sit on the same row, Cancel's right edge is at least 8 dp left of Save's left edge, Save has the primary style and Cancel does not, and Save is wider than Cancel

#### Scenario: Button order on the edit form
- **WHEN** the edit form of a stored card is shown
- **THEN** Cancel comes before Save in the document order and on screen, left to right

### Requirement: Cancel asks before discarding entries
The system SHALL, when the user taps Cancel on a form that holds entries, show a confirmation instead of leaving: "Discard this card?" on the add form and "Discard changes?" on the edit form, with the buttons Keep editing and Discard, and focus on Keep editing. A form holds entries when any field value differs from the value the form opened with (including a value filled by a suggestion), or a photo is attached or still being prepared. Keep editing SHALL close the confirmation and leave every field, photo and suggestion marker as it was. Discard SHALL leave the form as Cancel does today, saving nothing. On a form without entries, Cancel SHALL leave at once with no confirmation. Discard SHALL be drawn in the danger text colour, never as a primary button.

#### Scenario: Untouched add form closes at once
- **WHEN** the user opens the add form and taps Cancel without changing anything
- **THEN** no confirmation is shown and the screen the form was opened from is shown

#### Scenario: Typed field asks first
- **GIVEN** the user typed "Hank Aaron" as the player on the add form
- **WHEN** the user taps Cancel
- **THEN** a dialog named "Discard this card?" is shown with Keep editing focused and a Discard button, and the form is still showing

#### Scenario: Keep editing keeps everything
- **GIVEN** the discard confirmation is showing on the add form with "Hank Aaron" typed and a front photo attached
- **WHEN** the user taps Keep editing
- **THEN** the confirmation closes, the player still reads "Hank Aaron", the front photo is still attached, and nothing is saved

#### Scenario: Discard leaves without saving
- **GIVEN** the discard confirmation is showing on the add form opened from the list
- **WHEN** the user taps Discard
- **THEN** the collection list is shown and no card was added

#### Scenario: Edit form asks with its own wording
- **GIVEN** the user changed the quantity on the edit form of a stored card
- **WHEN** the user taps Cancel and then Discard
- **THEN** the dialog was named "Discard changes?", and the card's detail screen is shown with the stored quantity unchanged

#### Scenario: Unchanged edit form closes at once
- **WHEN** the user opens the edit form of a stored card and taps Cancel without changing anything
- **THEN** no confirmation is shown and the card's detail screen is shown

#### Scenario: A photo alone counts as an entry
- **WHEN** the user attaches a front photo on the add form, types nothing, and taps Cancel
- **THEN** the "Discard this card?" confirmation is shown

#### Scenario: Typing a value back is not an entry
- **WHEN** the user types "1" into an empty Year field on the add form, clears it again, and taps Cancel
- **THEN** no confirmation is shown and the form closes
