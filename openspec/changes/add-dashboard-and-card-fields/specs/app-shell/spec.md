## MODIFIED Requirements

### Requirement: Hardware back button goes up one screen
The system SHALL handle the Android back button by returning to the previous screen of the flow, and SHALL close the app only when the dashboard is showing.

#### Scenario: Back from the add form
- **WHEN** the user opens the add form from the list and presses back
- **THEN** the collection list is shown and the app stays open

#### Scenario: Back from editing a card
- **WHEN** the user opens the edit form from a card's detail view and presses back
- **THEN** that card's detail view is shown

#### Scenario: Back from the list
- **WHEN** the collection list is showing and the user presses back
- **THEN** the dashboard is shown and the app stays open

#### Scenario: Back from the dashboard
- **WHEN** the dashboard is showing and the user presses back
- **THEN** the app closes

#### Scenario: Back from the add form opened on the dashboard
- **WHEN** the user opens the add form from the dashboard and presses back
- **THEN** the dashboard is shown and the app stays open
