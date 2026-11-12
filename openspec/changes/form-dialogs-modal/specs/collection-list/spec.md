## MODIFIED Requirements

### Requirement: Delete asks in a centred dialog
The system SHALL, when Delete is tapped on the card detail screen, show a modal dialog (role alertdialog, named "Delete card") centred on the screen over a scrim, with the question "Delete this card?", a Delete button outlined in the danger colour on the left and a Keep button filled as the primary button on the right, of equal width, as the screen's Delete and Edit pair is drawn; Keep has focus when the dialog opens. Delete in the dialog SHALL delete the card as the `card-catalog` capability describes (soft delete, its photos queued for removal from Drive) and leave the detail screen. Keep, a tap on the scrim, Escape and Android back SHALL close the dialog without deleting and return focus to the screen's Delete button; Android back SHALL close the dialog before it leaves the screen. The dialog SHALL be fully visible without scrolling at any scroll position of the detail screen and SHALL sit above the system bars.

#### Scenario: Dialog over the screen
- **GIVEN** the detail screen of a card is scrolled to its end on a 360 by 800 phone
- **WHEN** the user taps Delete
- **THEN** a "Delete card" alertdialog is centred in the viewport with its Delete and Keep buttons in view with Delete on the left, Keep has focus, Keep is filled with the ink colour, and Delete has a danger-coloured border and text on a transparent background, both of equal width within 1 dp

#### Scenario: Confirm deletes
- **WHEN** the user taps Delete and then Delete in the dialog
- **THEN** the card leaves the collection and the screen it was opened from is shown

#### Scenario: Keep keeps the card
- **WHEN** the user taps Delete and then Keep
- **THEN** the dialog closes, the card is unchanged and the Delete button has focus

#### Scenario: Back closes the dialog first
- **WHEN** the user taps Delete and presses Android back
- **THEN** the dialog closes, the detail screen is still shown and the card is unchanged; pressing back again leaves the detail screen

#### Scenario: Scrim tap keeps the card
- **WHEN** the user taps Delete and then taps the scrim outside the dialog
- **THEN** the dialog closes and the card is unchanged

