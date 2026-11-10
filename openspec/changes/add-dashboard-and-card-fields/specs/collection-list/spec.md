## ADDED Requirements

### Requirement: The list returns to the dashboard
The system SHALL show a Back control in the collection screen header that returns to the dashboard, and SHALL keep the list's search and filters while the user opens a card and comes back.

#### Scenario: Back to the dashboard
- **WHEN** the user taps Back in the collection screen header
- **THEN** the dashboard is shown

#### Scenario: Filters survive opening a card
- **GIVEN** the list is filtered to Autograph
- **WHEN** the user opens a card and goes back
- **THEN** the list is still filtered to Autograph with its chip showing
