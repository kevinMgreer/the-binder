# app-shell Specification

## Purpose
Defines how the app sits inside Android's system bars and answers the hardware back button, so every control is reachable and navigation behaves like an Android app.

## Requirements

### Requirement: Content stays clear of the system bars
The system SHALL lay out every screen inside the status bar and navigation bar insets, so that no text or control is covered by a system bar, including the last control of a screen that scrolls.

#### Scenario: Title below the status bar
- **WHEN** any screen is shown on a phone whose status bar overlaps the window
- **THEN** the screen's title and controls start below the status bar

#### Scenario: End of a scrolled form
- **WHEN** the user scrolls the card form to its end on a phone with a gesture or button navigation bar
- **THEN** the Save and Cancel buttons are fully visible and tappable above the navigation bar

### Requirement: Hardware back button goes up one screen
The system SHALL handle the Android back button by returning to the previous screen of the flow, and SHALL close the app only when the collection list is showing.

#### Scenario: Back from the add form
- **WHEN** the user opens the add form from the list and presses back
- **THEN** the collection list is shown and the app stays open

#### Scenario: Back from editing a card
- **WHEN** the user opens the edit form from a card's detail view and presses back
- **THEN** that card's detail view is shown

#### Scenario: Back from the list
- **WHEN** the collection list is showing and the user presses back
- **THEN** the app closes
