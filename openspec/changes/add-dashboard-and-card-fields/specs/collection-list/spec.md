## MODIFIED Requirements

### Requirement: The list leads with finding a card
The system SHALL show, on the collection screen, a header with a Back control to the dashboard, the title, the collection count, the sync state and Settings, then one row holding the search field and a Filter button, then the card list. It SHALL offer exactly one add action, a primary "Add card" button fixed above the system bars, which opens a sheet with Scan card, Pick from photos and Enter by hand.

#### Scenario: First screen
- **WHEN** the collection screen opens on a 360 by 800 phone, with the update banner showing
- **THEN** the count, the sync state, the search field and the Filter button are visible without scrolling, and at least three card rows are visible below them

#### Scenario: One add action
- **WHEN** the collection screen is shown
- **THEN** exactly one add button is visible, and tapping it shows Scan card, Pick from photos and Enter by hand, each reachable in one more tap

#### Scenario: Sign in again stays reachable
- **WHEN** the session needs a new sign-in
- **THEN** Sign in again is shown in the header area in one tap

#### Scenario: Back to the dashboard
- **WHEN** the user taps Back in the collection screen header
- **THEN** the dashboard is shown

#### Scenario: Filters survive opening a card
- **GIVEN** the list is filtered to Autograph
- **WHEN** the user opens a card and goes back
- **THEN** the list is still filtered to Autograph with its chip showing
