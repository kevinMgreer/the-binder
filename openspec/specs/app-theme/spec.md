# app-theme Specification

## Purpose
Defines the app's visual foundation: design tokens, light and dark themes that follow the phone, and the legibility and touch rules every screen obeys.

## Requirements

### Requirement: Screens use design tokens only
The system SHALL define every colour, spacing, radius, type size and touch-target size as a token in one place, and SHALL style every screen from those tokens alone.

#### Scenario: No raw colours outside the token file
- **WHEN** the style sheets and components are scanned for colour literals (hex, rgb or hsl)
- **THEN** the only matches are in the token file

#### Scenario: Changing a token restyles every screen
- **WHEN** a test overrides the accent colour token on the root element
- **THEN** the computed colour of the primary button, an active filter chip and a serial tag all change to it

### Requirement: The theme follows the phone
The system SHALL show the light theme when Android is set to light and the dark theme when it is set to dark, SHALL switch while the app is running when the setting changes, and SHALL declare `color-scheme: light dark` so native controls follow the theme.

#### Scenario: Dark system setting
- **WHEN** Android is in dark mode and the app opens
- **THEN** the app shows the dark theme, with no white flash at launch

#### Scenario: Light system setting
- **WHEN** Android is in light mode and the app opens
- **THEN** the app shows the light theme, with its own light palette defined (every colour role has a separate light value)

#### Scenario: Setting changes while running
- **WHEN** Android switches between light and dark with the app open
- **THEN** the app's page background changes to the other theme's without a restart

### Requirement: Text is legible and controls are reachable
The system SHALL give body text a contrast ratio of at least 4.5 to 1 against its background in both themes, including text on the pocket (the see-through pocket blended over the page), and SHALL make every tappable control at least 48 dp square with at least 8 dp between neighbouring controls.

#### Scenario: Contrast in both themes
- **WHEN** the text and background token pairs of each theme are measured, including text, muted text, accent text, ok and danger on page, binder page and blended pocket, and on-accent text on the accent
- **THEN** every body-text pair is at least 4.5 to 1 and every large-text or icon pair at least 3 to 1

#### Scenario: Touch targets
- **WHEN** any button, chip, input or row is measured on a 360 dp wide phone
- **THEN** it is at least 48 dp high and wide, with at least 8 dp to the next control

### Requirement: Every state is designed
The system SHALL style the empty collection, no matching cards, sync error, needs-decision dialog, confirm dialogs, update banner and offline photo note from the tokens in both themes.

#### Scenario: States at phone size
- **WHEN** each of those states is shown at 360 by 800 in each theme
- **THEN** its text is legible, its controls meet the touch-target rule and nothing sits under the system bars

### Requirement: Destructive actions stay apart
The system SHALL keep destructive actions (delete card, sign out) visually distinct and away from primary actions.

#### Scenario: Delete is not beside Edit
- **WHEN** the card detail screen is shown
- **THEN** Delete is separated from Edit by at least 24 dp or a divider, and is not drawn in the accent colour

#### Scenario: Sign out is apart in settings
- **WHEN** the settings screen is shown
- **THEN** Sign out is separated from the other settings by at least 24 dp or a divider, and is not drawn in the accent colour
