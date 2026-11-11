## MODIFIED Requirements

### Requirement: Bottom navigation between Dashboard and Cards
The system SHALL show a bottom navigation bar with two destinations, Dashboard and Cards in that order, on the dashboard and the collection list, and on no other screen (not on card detail, the add and edit forms or Settings); an open sheet covers it with its scrim. Each destination SHALL have an icon and a visible text label, a tap target at least 48 by 48 dp, and the bar SHALL sit above the system navigation or gesture bar using the same bottom inset as `#root`. The bar SHALL sit on the ground colour in the light theme and the panel colour in the dark theme, with a 1 px rule along its top. The active destination SHALL be marked by the ink colour, a heavier label weight, an ink-filled icon and `aria-current="page"`, with no underline, pill or line under the tabs; inactive destinations SHALL use the muted ink colour and stay readable with the contrast the theme requires. The bar SHALL use design tokens only, in both themes. Tapping Cards SHALL show the collection list with its last search and filters kept; tapping Dashboard SHALL show the dashboard; tapping the active destination SHALL do nothing.

#### Scenario: Shown on the top-level screens
- **WHEN** the dashboard or the collection list is showing
- **THEN** a navigation landmark holds exactly two items labelled Dashboard and Cards, and the item for the showing screen has `aria-current="page"`

#### Scenario: Hidden elsewhere
- **WHEN** the card detail, add form, edit form or Settings screen is showing
- **THEN** no bottom navigation bar is shown

#### Scenario: Switch to Cards keeps the list as it was
- **GIVEN** the list was filtered to Autograph and the user went to the dashboard with the bar
- **WHEN** the user taps Cards
- **THEN** the collection list is shown still filtered to Autograph with its chip showing

#### Scenario: Active destination is not colour alone
- **WHEN** the dashboard is showing, in the light and in the dark theme
- **THEN** the Dashboard item is in the ink colour with no pseudo-element underline while the Cards item is in the muted ink colour, its label weight is heavier than the Cards label's, its label is readable text, and no colour literal is used outside the tokens file

#### Scenario: Inactive label is readable
- **WHEN** the dashboard is showing, in the light and in the dark theme
- **THEN** the Cards label's effective colour against the bar is at least 4.5 to 1

#### Scenario: Above the gesture bar
- **WHEN** the bottom inset is 48 dp and the dashboard is showing on a 360 by 800 phone
- **THEN** both items are at least 48 by 48 dp, at least 8 dp apart, and end at least 48 dp above the bottom edge of the screen
