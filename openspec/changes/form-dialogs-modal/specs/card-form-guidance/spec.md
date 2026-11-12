## MODIFIED Requirements

### Requirement: Cancel asks before discarding entries
The system SHALL, when the user taps Cancel on a form that holds entries, show a confirmation instead of leaving: "Discard this card?" on the add form and "Discard changes?" on the edit form, with the buttons Keep editing and Discard, and focus on Keep editing. The confirmation SHALL be a modal dialog (role alertdialog, named by its question) centred on the screen over a scrim, as the card detail screen's Delete dialog is. The scrim SHALL cover the whole screen, the Cancel/Save bar included, and while the confirmation shows nothing behind it SHALL respond to taps or be reachable by keyboard focus or a screen reader. The confirmation SHALL be fully visible without scrolling at any scroll position of the form and SHALL sit above the system bars. A form holds entries when any field value differs from the value the form opened with (including a value filled by a suggestion), or a photo is attached or still being prepared. Keep editing, a tap on the scrim, Escape and Android back SHALL close the confirmation, leave every field, photo, suggestion marker and save-blocked message as it was, and return focus to Cancel. Discard SHALL leave the form as Cancel does today, saving nothing. On a form without entries, Cancel SHALL leave at once with no confirmation. Discard SHALL be drawn in the danger text colour, never as a primary button.

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
- **THEN** the confirmation closes, the player still reads "Hank Aaron", the front photo is still attached, nothing is saved, and Cancel has focus

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

#### Scenario: Centred over the bar
- **GIVEN** the user typed "Hank Aaron" on the add form on a 360 by 800 phone with a 48 dp bottom inset, in the light theme and in the dark theme
- **WHEN** the user taps Cancel
- **THEN** the "Discard this card?" dialog is fully in the viewport with its centre within 8 dp of the centre of the area above the bottom inset, the point at the centre of the Save button belongs to the scrim and not to the bar, and the dialog's Discard text is in the danger colour

#### Scenario: Scrim tap keeps editing
- **GIVEN** the discard confirmation is showing on the add form with "Hank Aaron" typed
- **WHEN** the user taps the scrim where the Save button is
- **THEN** the confirmation closes, no card is saved, the player still reads "Hank Aaron" and Cancel has focus

#### Scenario: Escape keeps editing
- **GIVEN** the discard confirmation is showing on the add form
- **WHEN** the user presses Escape
- **THEN** the confirmation closes, the form is still showing and Cancel has focus

#### Scenario: Form behind is out of reach
- **GIVEN** the discard confirmation is showing
- **WHEN** something tries to focus the Player field and the bar's Save button
- **THEN** focus stays inside the dialog, and neither the field nor the bar is exposed to a screen reader while the dialog shows

#### Scenario: Fully visible on a short screen
- **GIVEN** a 360 by 450 viewport (the height left with the soft keyboard open) and the add form scrolled to its end with a player typed
- **WHEN** the user taps Cancel
- **THEN** the dialog with its Keep editing and Discard buttons is fully in the viewport

### Requirement: Save stays in reach
The system SHALL keep the add and edit forms' Cancel and Save buttons in a bar pinned to the bottom of the screen while the form scrolls, in the order Cancel then Save, on the panel background with a 1 px rule along its top, ending above the system navigation bar (the bottom inset). The bar SHALL hold the save-blocked message directly above the buttons while that message shows, so the message stays next to Save. The form SHALL leave room at its end so its last field scrolls fully above the bar, and a field brought into view by focus SHALL NOT end under the bar. While the discard confirmation or the duplicate-card prompt shows, the bar SHALL stay where it is under that dialog's scrim and none of its buttons SHALL respond to a tap. The bar SHALL not appear on any other screen.

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

#### Scenario: Bar not tappable under a dialog
- **GIVEN** the discard confirmation, or the duplicate-card prompt, is showing on the add form on a 360 by 800 phone
- **WHEN** the user taps where the bar's Save button is (or, in a second run, where its Cancel button is)
- **THEN** the tap lands on the scrim and closes the dialog as a scrim tap does, no card is saved, the collection is unchanged and the form is still showing

#### Scenario: Blocked message kept under the dialog
- **GIVEN** a save was refused and the message naming "Player" is in the bar, and the user then typed a year
- **WHEN** the user taps Cancel and then Keep editing
- **THEN** the message naming "Player" is still in the bar directly above Save

## ADDED Requirements

### Requirement: The duplicate-card prompt is a centred dialog
The system SHALL, when Save on the add form finds a card already in the collection (as the `card-catalog` capability's "Quantity of duplicates" describes), show the duplicate-card prompt as a modal dialog (role alertdialog, named "Duplicate card") centred on the screen over a scrim that covers the whole screen, the Cancel/Save bar included. The dialog's description SHALL be its message "This card is already in your collection (N owned).", where N is the stored card's quantity. It SHALL have the buttons Increase quantity, Add as separate card and Back to form, in that order, with Increase quantity focused. Increase quantity and Add as separate card SHALL save as `card-catalog` describes. Back to form, a tap on the scrim, Escape and Android back SHALL close the prompt without saving, leave every field and photo as it was, keep the form showing, and return focus to Save. While the prompt shows, nothing behind it SHALL respond to taps or be reachable by keyboard focus or a screen reader. The prompt SHALL be fully visible without scrolling at any scroll position of the form and SHALL sit above the system bars.

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
- **THEN** the prompt closes, no discard confirmation is shown, the form is still showing with its typed fields, nothing is saved and Save has focus

#### Scenario: Scrim tap and Escape keep the form
- **WHEN** the user taps the scrim outside the prompt, or presses Escape
- **THEN** the prompt closes, nothing is saved and the form is still showing

#### Scenario: Fully visible on a short screen
- **GIVEN** a 360 by 450 viewport and a duplicate typed on the add form scrolled to its end
- **WHEN** the user taps Save
- **THEN** the prompt with all three buttons is fully in the viewport
