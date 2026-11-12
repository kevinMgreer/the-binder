## ADDED Requirements

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
