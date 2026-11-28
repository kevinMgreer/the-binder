## ADDED Requirements

### Requirement: Delete several cards
The system SHALL let the user delete the selected cards from selection mode in one step.

In selection mode the bar SHALL show an icon-only trash button named "Delete" for assistive technology, placed immediately before "Edit", with a touch target of at least 48 by 48 px; the bar SHALL stay one row at 360 px wide. Delete SHALL be disabled while no shown card is selected.

Delete SHALL show a modal dialog (role alertdialog, named "Delete cards") centred on the screen over a scrim, with the question "Delete N cards?" ("Delete 1 card?" for one), where N counts the selected cards the current search and filters show. The dialog SHALL have a Delete button outlined in the danger colour on the left and a Keep button filled as the primary button on the right; Keep has focus when the dialog opens. Keep, a tap on the scrim, Escape and Android back SHALL close the dialog without deleting anything, keep selection mode and the selection, and return focus to the bar's Delete button; Android back SHALL close the dialog before it leaves selection mode.

Delete in the dialog SHALL delete each selected card the current search and filters show, as the `card-catalog` capability describes for one card (soft delete, its photos queued for removal from Drive); selected cards the search and filters hide SHALL not be deleted. All deleted cards SHALL be queued for one sync to Drive after the last card, not one sync per card. When every card is deleted, the dialog SHALL close, selection mode SHALL end and the list SHALL show without the deleted cards. When some cards fail to delete, the dialog SHALL stay open and say how many cards could not be deleted, the cards that failed SHALL stay selected and the cards that were deleted SHALL leave the selection and the list; the system SHALL never report a card as deleted that was not.

#### Scenario: Trash button in the bar
- **GIVEN** selection mode on a 360 by 800 phone with one card selected
- **WHEN** the selection bar is shown
- **THEN** a button named "Delete" with no visible text sits immediately before "Edit", it is at least 48 by 48 px, and the bar is one row with no wrapped text

#### Scenario: Delete disabled with nothing selected
- **GIVEN** selection mode with no card selected
- **WHEN** the selection bar is shown
- **THEN** the Delete button is disabled

#### Scenario: Dialog asks for the count
- **GIVEN** selection mode with 3 cards selected
- **WHEN** the user taps Delete
- **THEN** a "Delete cards" alertdialog is centred in the viewport asking "Delete 3 cards?", Delete is on the left with a danger-coloured border and text, Keep is on the right filled with the ink colour, and Keep has focus

#### Scenario: Confirm deletes the selected cards
- **GIVEN** 10 cards with 3 selected, each with a front and back photo stored in Drive
- **WHEN** the user taps Delete and then Delete in the dialog
- **THEN** the 3 cards are soft-deleted, their 6 photos and their thumbnails are queued for removal from Drive, the other 7 cards are unchanged, selection mode has ended and the list shows the 7 cards

#### Scenario: Keep deletes nothing
- **GIVEN** selection mode with 3 cards selected and the delete dialog open
- **WHEN** the user taps Keep
- **THEN** the dialog closes, no card is deleted, the bar still shows "3 selected" and the Delete button has focus

#### Scenario: Scrim, Escape and back delete nothing
- **GIVEN** selection mode with 3 cards selected and the delete dialog open
- **WHEN** the user taps the scrim, presses Escape, or presses Android back
- **THEN** the dialog closes, no card is deleted and the bar still shows "3 selected"; a further Android back leaves selection mode and the list is still shown

#### Scenario: Hidden selected cards are not deleted
- **GIVEN** 5 cards selected, then a filter that shows only 2 of them
- **WHEN** the user taps Delete and confirms
- **THEN** the dialog asked "Delete 2 cards?", only those 2 cards are deleted, and the 3 hidden cards are unchanged

#### Scenario: One sync after a bulk delete
- **GIVEN** 20 selected cards and sync signed in
- **WHEN** the user confirms "Delete 20 cards?"
- **THEN** sync is notified of the change once, and one sync writes all 20 deletions to Drive

#### Scenario: Some cards fail to delete
- **GIVEN** 3 selected cards where storing the deletion of 1 card fails
- **WHEN** the user confirms "Delete 3 cards?"
- **THEN** 2 cards are deleted and leave the list, the dialog stays open and says 1 card could not be deleted, the bar shows "1 selected" with the failed card still selected, and no message says all 3 were deleted

#### Scenario: Deleted cards stay deleted after a fresh install
- **GIVEN** 3 cards deleted with bulk delete and a finished sync to Drive
- **WHEN** the app is installed fresh, signed in to the same account and syncs
- **THEN** none of the 3 cards appears in the collection
