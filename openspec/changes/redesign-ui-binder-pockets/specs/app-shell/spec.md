## ADDED Requirements

### Requirement: Screens that the back button handles show no Back button
The system SHALL NOT show an on-screen Back button on the card detail and settings screens, because the Android back button and gesture already return to the list there. It SHALL keep Cancel on the add and edit forms and Close on sheets.

#### Scenario: Detail and settings have no Back button
- **WHEN** the card detail or settings screen is showing
- **THEN** no button named Back is shown, and pressing the Android back button shows the collection list and keeps the app open
