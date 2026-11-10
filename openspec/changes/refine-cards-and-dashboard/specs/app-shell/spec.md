## MODIFIED Requirements

### Requirement: Screens that the back button handles show no Back button
The system SHALL NOT show an on-screen Back button on the card detail and settings screens, because the Android back button and gesture already return to the previous screen there (the screen each was opened from: the list or the dashboard). It SHALL keep Cancel on the add and edit forms and Close on sheets.

#### Scenario: Detail and settings have no Back button
- **WHEN** the card detail or settings screen is showing
- **THEN** no button named Back is shown, and pressing the Android back button shows the screen it was opened from and keeps the app open

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

#### Scenario: Back from a card opened on the dashboard
- **WHEN** the user opens a card from the dashboard's Recently added and presses back
- **THEN** the dashboard is shown with the bar and Dashboard active

#### Scenario: Delete a card opened on the dashboard
- **WHEN** the user opens a card from the dashboard's Recently added and deletes it
- **THEN** the dashboard is shown without that card

#### Scenario: Back from the add form
- **WHEN** the user taps Add card on the list, then presses back
- **THEN** the list is shown with the bar; when Add card was tapped on the dashboard, the dashboard is shown

### Requirement: Top-level screens are titled by the screen, not the app
The system SHALL title the dashboard "Dashboard" and the collection list "Cards", as the level-one heading at the left of the header, with the sync state and then the Settings gear on the same row at the right, and SHALL NOT show the app name "The Binder" as a heading on any signed-in screen. Neither screen SHALL have a count or sync line beneath its title. The app name SHALL stay as the heading of the signed-out sign-in screen only.

#### Scenario: Dashboard title
- **WHEN** the signed-in user opens the app
- **THEN** the level-one heading reads "Dashboard", the sync state and the gear are on its row at the right, and no heading reads "The Binder"

#### Scenario: Cards title
- **WHEN** the user taps Cards in the bar
- **THEN** the level-one heading reads "Cards", the sync state and the gear are on its row, and no "N cards, N distinct" line is shown beneath it

#### Scenario: App name on sign-in only
- **WHEN** the app opens signed out
- **THEN** the sign-in screen's heading reads "The Binder"

### Requirement: Add card opens the card form above the bottom navigation
The system SHALL show exactly one Add card button on the dashboard and on the collection list, as the full-width primary button fixed just above the bottom navigation bar with at least 8 dp between them, and tapping it SHALL open the add card form directly, with no sheet in between.

#### Scenario: One tap to the form
- **WHEN** the user taps Add card on the dashboard or the list
- **THEN** the add card form is shown and no "Add a card" sheet, "Scan card" or "Enter by hand" choice appears

#### Scenario: One add button per screen
- **WHEN** the dashboard or the list is showing
- **THEN** exactly one button named "Add card" is visible, its bottom edge is at least 8 dp above the top of the bottom navigation bar, and it does not cover the dashboard's last item (the last Top teams entry, or the last tile when no other group shows) once scrolled to the end
