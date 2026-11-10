## ADDED Requirements

### Requirement: The list returns to the dashboard
The system SHALL return from the collection list to the dashboard when the user presses the Android back button (the list has no on-screen Back control), and SHALL keep the list's search and filters while the user opens a card and comes back.

#### Scenario: Back to the dashboard
- **WHEN** the collection list is showing and the user presses back
- **THEN** the dashboard is shown, and the list header has no Back button

#### Scenario: Filters survive opening a card
- **GIVEN** the list is filtered to Autograph
- **WHEN** the user opens a card and goes back
- **THEN** the list is still filtered to Autograph with its chip showing
