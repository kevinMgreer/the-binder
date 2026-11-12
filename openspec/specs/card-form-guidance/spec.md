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
The system SHALL, when the user taps Cancel on a form that holds entries, ask instead of leaving: "Discard this card?" on the add form and "Discard changes?" on the edit form. The question SHALL replace the Cancel/Save bar in place at the bottom of the screen, with no scrim and no centred dialog, holding two buttons of equal width as card detail's Delete and Edit pair is drawn: Discard outlined in the danger colour on the left, and Keep editing filled as the primary button on the right. Keep editing SHALL have focus. The bar SHALL show no question text, only the two buttons; the question SHALL be the accessible name of the button pair (role group, name "Discard this card?" or "Discard changes?"), and also the accessible description of both buttons, through visually hidden text that takes no space and is not drawn, so a screen reader reads it when focus lands on Keep editing. While it shows, the Cancel and Save buttons SHALL NOT exist, and Discard SHALL ignore taps for the first 500 ms after the question appears, so a double tap on Cancel cannot discard. A form holds entries when any field value differs from the value the form opened with (including a value filled by a suggestion), or a photo is attached or still being prepared. Keep editing, Escape and Android back SHALL close the question, restore the bar, leave every field, photo, suggestion marker and save-blocked message as it was, and return focus to Cancel. Discard SHALL leave the form as Cancel does today, saving nothing. On a form without entries, Cancel SHALL leave at once with no question. Discard SHALL be outlined in danger, never a filled primary button.

#### Scenario: Untouched add form closes at once
- **WHEN** the user opens the add form and taps Cancel without changing anything
- **THEN** no confirmation is shown and the screen the form was opened from is shown

#### Scenario: Typed field asks first
- **GIVEN** the user typed "Hank Aaron" as the player on the add form
- **WHEN** the user taps Cancel
- **THEN** the bar shows a group named "Discard this card?" holding Discard on the left and Keep editing on the right and focused, with no visible question text, and the form is still showing

#### Scenario: Keep editing keeps everything
- **GIVEN** the discard confirmation is showing on the add form with "Hank Aaron" typed and a front photo attached
- **WHEN** the user taps Keep editing
- **THEN** the confirmation closes, the player still reads "Hank Aaron", the front photo is still attached, nothing is saved, and Cancel has focus

#### Scenario: Discard leaves without saving
- **GIVEN** the discard confirmation is showing on the add form opened from the list
- **WHEN** the user taps Discard
- **THEN** the collection list is shown and no card was added

#### Scenario: Edit form asks with its own wording
- **GIVEN** the user changed the quantity on the edit form of a stored card
- **WHEN** the user taps Cancel and then Discard
- **THEN** the button group was named "Discard changes?", and the card's detail screen is shown with the stored quantity unchanged

#### Scenario: Unchanged edit form closes at once
- **WHEN** the user opens the edit form of a stored card and taps Cancel without changing anything
- **THEN** no confirmation is shown and the card's detail screen is shown

#### Scenario: A photo alone counts as an entry
- **WHEN** the user attaches a front photo on the add form, types nothing, and taps Cancel
- **THEN** the group named "Discard this card?" is shown

#### Scenario: Typing a value back is not an entry
- **WHEN** the user types "1" into an empty Year field on the add form, clears it again, and taps Cancel
- **THEN** no question is shown and the form closes

#### Scenario: The question takes the bar's place
- **GIVEN** the user typed "Hank Aaron" on the add form on a 360 by 800 phone with a 48 dp bottom inset, in the light theme and in the dark theme
- **WHEN** the user taps Cancel
- **THEN** the bar is in the same place above the bottom inset and holds only the group named "Discard this card?" with its two buttons and no other visible text, no scrim or dialog is shown, Cancel and Save are not in the page, and Discard is left of Keep editing with equal widths within 1 dp, each at least 48 dp high

#### Scenario: The pair is drawn like Delete and Edit
- **WHEN** the question shows
- **THEN** Discard has a transparent background with a danger-coloured border and text, and Keep editing has the ink background and the ground text colour

#### Scenario: A double tap on Cancel does not discard
- **GIVEN** the add form has "Hank Aaron" typed
- **WHEN** the user taps Cancel and taps the same point again within 500 ms
- **THEN** the question is still showing, nothing is discarded, and a tap on Discard after 500 ms leaves the form

#### Scenario: Escape keeps editing
- **GIVEN** the discard question is showing on the add form
- **WHEN** the user presses Escape
- **THEN** the question closes, the bar shows Cancel and Save again, the form is still showing and Cancel has focus

#### Scenario: Android back keeps editing
- **GIVEN** the discard question is showing
- **WHEN** the user presses Android back
- **THEN** the question closes, the entries are kept and Cancel has focus

#### Scenario: Short screen
- **GIVEN** a 360 by 450 viewport (the height left with the soft keyboard open) and the add form scrolled to its end with a player typed
- **WHEN** the user taps Cancel
- **THEN** the question with both buttons is fully in the viewport

### Requirement: Save stays in reach
The system SHALL keep the add and edit forms' Cancel and Save buttons in a bar pinned to the bottom of the screen while the form scrolls, in the order Cancel then Save, on the panel background with a 1 px rule along its top, ending above the system navigation bar (the bottom inset). The bar SHALL hold the save-blocked message directly above the buttons while that message shows, so the message stays next to Save. The form SHALL leave room at its end so its last field scrolls fully above the bar, and a field brought into view by focus SHALL NOT end under the bar. While the discard question shows, it SHALL take the bar's place (see "Cancel asks before discarding entries"). While the duplicate-card prompt shows, the bar SHALL stay where it is under that dialog's scrim and none of its buttons SHALL respond to a tap. The bar SHALL not appear on any other screen.

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

#### Scenario: Bar not tappable under the duplicate dialog
- **GIVEN** the duplicate-card prompt is showing on the add form on a 360 by 800 phone
- **WHEN** the user taps where the bar's Save button is (or, in a second run, where its Cancel button is)
- **THEN** the tap lands on the scrim and closes the dialog as a scrim tap does, no card is saved, the collection is unchanged and the form is still showing

#### Scenario: Blocked message kept under the question
- **GIVEN** a save was refused and the message naming "Player" is in the bar, and the user then typed a year
- **WHEN** the user taps Cancel and then Keep editing
- **THEN** the message naming "Player" is still in the bar directly above Save

### Requirement: The duplicate-card prompt is a centred dialog
The system SHALL, when Save on the add form finds a card already in the collection (as the `card-catalog` capability's "Quantity of duplicates" describes), show the duplicate-card prompt as a modal dialog (role alertdialog, named "Duplicate card") centred on the screen over a scrim that covers the whole screen, the Cancel/Save bar included. The dialog's description SHALL be its message "This card is already in your collection (N owned).", where N is the stored card's quantity. It SHALL have the buttons Increase quantity, Add as separate card and Back to form, in that order, with Increase quantity focused. Increase quantity SHALL be filled as the primary button and the other two outlined in ink; none SHALL be drawn in the danger colour. Increase quantity and Add as separate card SHALL save as `card-catalog` describes. Back to form, a tap on the scrim, Escape and Android back SHALL close the prompt without saving, leave every field and photo as it was, keep the form showing, and return focus to Save. While the prompt shows, nothing behind it SHALL respond to taps or be reachable by keyboard focus or a screen reader. The prompt SHALL be fully visible without scrolling at any scroll position of the form and SHALL sit above the system bars.

#### Scenario: Prompt centred over the bar
- **GIVEN** a card matching the typed one is already in the collection, on a 360 by 800 phone, in the light theme and in the dark theme
- **WHEN** the user taps Save at the top of the add form
- **THEN** a "Duplicate card" alertdialog is fully in the viewport with its centre within 8 dp of the centre of the area above the bottom inset, its description reads "This card is already in your collection (1 owned).", its three buttons are in view with Increase quantity focused, and the point at the centre of the Save button belongs to the scrim

#### Scenario: Increase quantity still merges
- **WHEN** the user taps Increase quantity in the prompt
- **THEN** the list shows one row for the card with "×2"

#### Scenario: Back to form keeps the entries
- **WHEN** the user taps Back to form in the prompt
- **THEN** the prompt closes, nothing is saved, every typed field is unchanged, and Save has focus

#### Scenario: Android back keeps the form
- **GIVEN** the duplicate-card prompt is showing on the add form opened from the list
- **WHEN** the user presses Android back
- **THEN** the prompt closes, no discard question is shown, the form is still showing with its typed fields, nothing is saved and Save has focus

#### Scenario: Scrim tap and Escape keep the form
- **WHEN** the user taps the scrim outside the prompt, or presses Escape
- **THEN** the prompt closes, nothing is saved and the form is still showing

#### Scenario: Fully visible on a short screen
- **GIVEN** a 360 by 450 viewport and a duplicate typed on the add form scrolled to its end
- **WHEN** the user taps Save
- **THEN** the prompt with all three buttons is fully in the viewport
