## ADDED Requirements

### Requirement: Bottom navigation between Dashboard and Cards
The system SHALL show a bottom navigation bar with two destinations, Dashboard and Cards in that order, on the dashboard and the collection list, and on no other screen (not on card detail, the add and edit forms or Settings); an open sheet covers it with its scrim. Each destination SHALL have an icon and a visible text label, a tap target at least 48 by 48 dp, and the bar SHALL sit above the system navigation or gesture bar using the same bottom inset as `#root`. The active destination SHALL be marked by an indicator shape behind its icon, the accent colour and `aria-current="page"`, so it does not rely on colour alone. The bar SHALL use design tokens only, in both themes. Tapping Cards SHALL show the collection list with its last search and filters kept; tapping Dashboard SHALL show the dashboard; tapping the active destination SHALL do nothing.

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
- **THEN** the Dashboard item has an indicator shape behind its icon that the Cards item does not have, its label is readable text, and no colour literal is used outside the tokens file

#### Scenario: Above the gesture bar
- **WHEN** the bottom inset is 48 dp and the dashboard is showing on a 360 by 800 phone
- **THEN** both items are at least 48 by 48 dp, at least 8 dp apart, and end at least 48 dp above the bottom edge of the screen

### Requirement: Back moves between the two destinations like tabs
The system SHALL treat Dashboard as the start destination: pressing the Android back button on the collection list SHALL show the dashboard, and on the dashboard SHALL close the app, however the user reached that screen. Back from a screen opened from a destination SHALL return to that destination, and back SHALL close an open sheet first.

#### Scenario: Back from Cards
- **WHEN** the user taps Cards in the bar and then presses back
- **THEN** the dashboard is shown and the app stays open

#### Scenario: Back from Dashboard after switching
- **WHEN** the user goes Dashboard, Cards, Dashboard with the bar and then presses back
- **THEN** the app closes

#### Scenario: Back from card detail
- **WHEN** the user opens a card from the list and presses back
- **THEN** the list is shown with the bar and Cards active

#### Scenario: Back from the add form
- **WHEN** the user taps Add card on the list, then presses back
- **THEN** the list is shown with the bar; when Add card was tapped on the dashboard, the dashboard is shown

### Requirement: Top-level screens are titled by the screen, not the app
The system SHALL title the dashboard "Dashboard" and the collection list "Cards", as the level-one heading at the left of the header with the Settings gear on the same row at the right, and SHALL NOT show the app name "The Binder" as a heading on any signed-in screen. The list SHALL keep its count and sync state on the line beneath its title; the dashboard SHALL keep its sync state beneath its title. The app name SHALL stay as the heading of the signed-out sign-in screen only.

#### Scenario: Dashboard title
- **WHEN** the signed-in user opens the app
- **THEN** the level-one heading reads "Dashboard", the gear is on its row at the right, and no heading reads "The Binder"

#### Scenario: Cards title
- **WHEN** the user taps Cards in the bar
- **THEN** the level-one heading reads "Cards", with the count (for example "12 cards, 10 distinct") and the sync state on the line beneath it

#### Scenario: App name on sign-in only
- **WHEN** the app opens signed out
- **THEN** the sign-in screen's heading reads "The Binder"

### Requirement: Settings opens from a gear icon
The system SHALL offer Settings on the dashboard and the collection list as an icon-only gear button at the top right of the header, with the accessible name "Settings" and a tap target at least 48 by 48 dp, drawn from the design tokens, and SHALL NOT show a text Settings button there.

#### Scenario: Gear in the header
- **WHEN** the dashboard or the list is showing on a 360 by 800 phone
- **THEN** one button named "Settings" shows a gear icon and no visible text, is at least 48 by 48 dp, and its right edge is within 12 dp of the screen's right edge, inside the header

#### Scenario: Gear opens Settings
- **WHEN** the user taps the gear on the list and then presses back
- **THEN** Settings is shown, and back returns to the list

### Requirement: Add card opens the card form above the bottom navigation
The system SHALL show exactly one Add card button on the dashboard and on the collection list, as the full-width primary button fixed just above the bottom navigation bar with at least 8 dp between them, and tapping it SHALL open the add card form directly, with no sheet in between.

#### Scenario: One tap to the form
- **WHEN** the user taps Add card on the dashboard or the list
- **THEN** the add card form is shown and no "Add a card" sheet, "Scan card" or "Enter by hand" choice appears

#### Scenario: One add button per screen
- **WHEN** the dashboard or the list is showing
- **THEN** exactly one button named "Add card" is visible, its bottom edge is at least 8 dp above the top of the bottom navigation bar, and it does not cover the Browse collection button or the last stat tile once scrolled to the end
