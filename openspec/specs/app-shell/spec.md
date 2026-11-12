# app-shell Specification

## Purpose
Defines how the app sits inside Android's system bars and answers the hardware back button, and the shared chrome: the bottom navigation, screen titles, the settings gear and the Add item in the bottom navigation, so every control is reachable and navigation behaves like an Android app.

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
The system SHALL handle the Android back button by returning to the previous screen of the flow, and SHALL close the app only when the dashboard is showing. On the add or edit form, back SHALL act like Cancel: when the form holds entries it SHALL show the same discard confirmation (see the `card-form-guidance` capability) instead of leaving, and back while that confirmation is showing SHALL close it as Keep editing does.

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

#### Scenario: Back from settings
- **WHEN** the user opens Settings from the dashboard and presses back (Settings has no on-screen Back button)
- **THEN** the dashboard is shown; when Settings was opened from the list, the list is shown

#### Scenario: Back on a form with entries asks first
- **GIVEN** the user typed a player on the add form opened from the list
- **WHEN** the user presses back
- **THEN** the "Discard this card?" confirmation is shown and the form is still showing

#### Scenario: Back again keeps editing
- **GIVEN** the discard confirmation is showing after a back press
- **WHEN** the user presses back again
- **THEN** the confirmation closes, the form is still showing with the typed player, and the app stays open

#### Scenario: Discard after back
- **GIVEN** the discard confirmation is showing after a back press on the add form opened from the list
- **WHEN** the user taps Discard
- **THEN** the collection list is shown and no card was added

### Requirement: Screens that the back button handles show no Back button
The system SHALL NOT show an on-screen Back button on the card detail and settings screens, because the Android back button and gesture already return to the previous screen there (the screen each was opened from: the list or the dashboard). It SHALL keep Cancel on the add and edit forms and Close on sheets.

#### Scenario: Detail and settings have no Back button
- **WHEN** the card detail or settings screen is showing
- **THEN** no button named Back is shown, and pressing the Android back button shows the screen it was opened from and keeps the app open

### Requirement: Bottom navigation between Dashboard and Cards
The system SHALL show a bottom navigation bar with three items in this order, Dashboard, Add and Cards, on the dashboard and the collection list, and on no other screen (not on card detail, the add and edit forms or Settings); an open sheet covers it with its scrim. Dashboard and Cards are destinations; Add is an action (a 24 dp plus icon in a 48 by 32 dp ink-filled frame with a 6 px radius, plain ground-coloured plus, label "Add", accessible name "Add card"; the frame is larger than the 24 dp icons of Dashboard and Cards on either side) that is never marked current and opens the add card form exactly as the former Add card button did, returning to the screen it was opened from on back, save or cancel. Each item SHALL have an icon and a visible text label, a tap target at least 48 by 48 dp, and the bar SHALL sit above the system navigation or gesture bar using the same bottom inset as `#root`. The bar SHALL sit on the ground colour in the light theme and the panel colour in the dark theme, with a 1 px rule along its top. The active destination SHALL be marked by the ink colour, label weight 600, a solid icon and `aria-current="page"`, with no underline, pill or line under the tabs; inactive destinations SHALL use the muted ink colour, label weight 400 and an outline version of the same icon, and stay readable with the contrast the theme requires. The bar SHALL use design tokens only, in both themes. Tapping Cards SHALL show the collection list with its last search and filters kept; tapping Dashboard SHALL show the dashboard; tapping the active destination SHALL do nothing.

#### Scenario: Shown on the top-level screens
- **WHEN** the dashboard or the collection list is showing
- **THEN** a navigation landmark holds exactly three items labelled Dashboard, Add and Cards in that order, the item for the showing screen has `aria-current="page"`, and Add never does

#### Scenario: Hidden elsewhere
- **WHEN** the card detail, add form, edit form or Settings screen is showing
- **THEN** no bottom navigation bar is shown

#### Scenario: Switch to Cards keeps the list as it was
- **GIVEN** the list was filtered to Autograph and the user went to the dashboard with the bar
- **WHEN** the user taps Cards
- **THEN** the collection list is shown still filtered to Autograph with its chip showing

#### Scenario: Active destination is not colour alone
- **WHEN** the dashboard is showing, in the light and in the dark theme
- **THEN** the Dashboard item is in the ink colour with no pseudo-element underline while the Cards item is in the muted ink colour, its label weight is 600 against the Cards label's 400, its icon is solid while the Cards icon is an outline (and they swap when Cards is the screen), the Add label stays at weight 500, its label is readable text, and no colour literal is used outside the tokens file

#### Scenario: Add frame is larger than its neighbours
- **WHEN** the dashboard or the collection list is showing
- **THEN** the Add frame is 48 by 32 dp with an ink background, wider and taller than the 24 dp icon of the Dashboard and Cards items, while all three items stay at least 48 by 48 dp

#### Scenario: Inactive label is readable
- **WHEN** the dashboard is showing, in the light and in the dark theme
- **THEN** the Cards label's effective colour against the bar is at least 4.5 to 1

#### Scenario: Above the gesture bar
- **WHEN** the bottom inset is 48 dp and the dashboard is showing on a 360 by 800 phone
- **THEN** all three items are at least 48 by 48 dp, at least 8 dp apart, and end at least 48 dp above the bottom edge of the screen

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

### Requirement: Settings opens from a gear icon
The system SHALL offer Settings on the dashboard and the collection list as an icon-only gear button at the top right of the header, with the accessible name "Settings" and a tap target at least 48 by 48 dp, drawn from the design tokens, and SHALL NOT show a text Settings button there.

#### Scenario: Gear in the header
- **WHEN** the dashboard or the list is showing on a 360 by 800 phone
- **THEN** one button named "Settings" shows a gear icon and no visible text, is at least 48 by 48 dp, and its right edge is within 12 dp of the screen's right edge, inside the header

#### Scenario: Gear opens Settings
- **WHEN** the user taps the gear on the list and then presses back
- **THEN** Settings is shown, and back returns to the list

### Requirement: Add card opens the card form above the bottom navigation
The system SHALL offer exactly one Add card control on the dashboard and on the collection list, the Add item of the bottom navigation (named "Add card"), and SHALL NOT draw a separate Add card button or a band behind one; tapping it SHALL open the add card form directly, with no sheet in between. Scrolling content SHALL end above the bar so the last item is fully reachable.

#### Scenario: One tap to the form
- **WHEN** the user taps Add card on the dashboard or the list
- **THEN** the add card form is shown and no "Add a card" sheet, "Scan card" or "Enter by hand" choice appears

#### Scenario: One add button per screen
- **WHEN** the dashboard or the list is showing
- **THEN** exactly one button named "Add card" exists and it is inside the bottom navigation, and no standalone Add card button or band exists; the dashboard's last item, scrolled to the end, ends above the bar

### Requirement: System navigation bar area has a solid background
The system SHALL paint the area under the system navigation bar (the bottom inset) with a solid background in the theme's ground colour on every screen that has no bottom navigation bar (card detail, the add and edit forms, Settings), in the light and the dark theme, so that scrolling content never shows behind the back, home and recents buttons. The strip SHALL be exactly the height of the bottom inset, SHALL not intercept touches, SHALL not cover the bottom navigation bar (which draws its own inset in the panel colour) or a sheet, and SHALL be absent when the inset is 0. The last control of a scrolled screen SHALL still end fully above the inset.

#### Scenario: Strip under the system buttons on the form
- **WHEN** the bottom inset is 48 dp and the add form is showing on a 360 by 800 phone, in the light and in the dark theme
- **THEN** a fixed strip 48 dp high sits at the bottom edge with the ground colour as its background and `pointer-events: none`

#### Scenario: Last control clears the strip
- **WHEN** the user scrolls the add form to its end with a 48 dp bottom inset
- **THEN** the Save button ends at least 48 dp above the bottom edge of the screen

#### Scenario: Bottom navigation is not covered
- **WHEN** the bottom inset is 48 dp and the dashboard is showing
- **THEN** the bottom navigation bar is painted over the strip, so its inset shows the panel colour
