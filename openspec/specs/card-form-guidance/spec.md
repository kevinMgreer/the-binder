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

### Requirement: Save stays in reach
The system SHALL keep the add and edit forms' Cancel and Save buttons in a bar pinned to the bottom of the screen while the form scrolls, in the order Cancel then Save, on the panel background with a 1 px rule along its top, ending above the system navigation bar (the bottom inset). The bar SHALL hold the save-blocked message directly above the buttons while that message shows, so the message stays next to Save. The form SHALL leave room at its end so its last field scrolls fully above the bar, and a field brought into view by focus SHALL NOT end under the bar. The bar SHALL not cover the confirmation and duplicate dialogs' buttons, and SHALL not appear on any other screen.

#### Scenario: Save visible at the top of a long form
- **WHEN** the add form opens on a 360 by 800 phone with a 48 dp bottom inset and the user has not scrolled
- **THEN** Cancel and Save are in the viewport, the bar's bottom is at least 48 dp above the bottom edge of the screen, and the bar has the panel background and a 1 px top rule

#### Scenario: Last field clears the bar
- **WHEN** the user scrolls the edit form to its end
- **THEN** the Notes field ends above the top of the bar

#### Scenario: Blocked message next to Save
- **WHEN** the user taps Save with the player and set fields empty at the top of the form
- **THEN** the Player field is focused and fully above the bar, and the message naming "Player" and "Set" is inside the bar directly above Save and in the viewport

#### Scenario: Order kept in the bar
- **WHEN** the edit form is shown
- **THEN** in the bar Cancel is left of Save and comes before Save in focus order
