## Purpose

Defines the app's visual foundation: design tokens, light and dark themes that follow the phone, and the legibility and touch rules every screen obeys.

## ADDED Requirements

### Requirement: Screens use design tokens only
The system SHALL define every colour, spacing, radius, type size and touch-target size as a token in one place, and SHALL style every screen from those tokens alone.

#### Scenario: No raw colours outside the token file
- **WHEN** the style sheets and components are scanned for colour literals (hex, rgb or hsl)
- **THEN** the only matches are in the token file

#### Scenario: Changing a token restyles every screen
- **WHEN** the accent colour token is changed
- **THEN** the primary button, the active filter chip and the serial tags all change with it

### Requirement: The theme follows the phone
The system SHALL show the light theme when Android is set to light and the dark theme when it is set to dark, and SHALL switch when the setting changes, without a setting of its own.

#### Scenario: Dark system setting
- **WHEN** Android is in dark mode and the app opens
- **THEN** the app shows the dark theme

#### Scenario: Light system setting
- **WHEN** Android is in light mode and the app opens
- **THEN** the app shows the light theme, designed for light (not the dark colours inverted)

### Requirement: Text is legible and controls are reachable
The system SHALL give body text a contrast ratio of at least 4.5 to 1 against its background in both themes, and SHALL make every tappable control at least 48 dp square with at least 8 dp between neighbouring controls.

#### Scenario: Contrast in both themes
- **WHEN** the text and background token pairs of each theme are measured
- **THEN** every body-text pair is at least 4.5 to 1 and every large-text or icon pair at least 3 to 1

#### Scenario: Touch targets
- **WHEN** any button, chip, input or row is measured on a 360 dp wide phone
- **THEN** it is at least 48 dp high and wide, with at least 8 dp to the next control

### Requirement: Destructive actions stay apart
The system SHALL keep destructive actions (delete card, sign out) visually distinct and away from primary actions.

#### Scenario: Delete is not beside Save
- **WHEN** the card detail and card form screens are shown
- **THEN** Delete and Sign out are separated from Edit, Save and Scan by at least 24 dp or a divider, and are not drawn in the accent colour
