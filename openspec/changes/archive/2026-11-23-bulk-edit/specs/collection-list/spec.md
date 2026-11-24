## ADDED Requirements

### Requirement: Select several cards and change them together
The system SHALL let the user select several cards in the collection list or grid and change shared fields on all of them in one step.

A "Select" action above the cards, or a long press on a card, SHALL start selection mode; a long press SHALL also select the pressed card. In selection mode a tap on a card SHALL toggle its selection instead of opening it, each selected row or tile SHALL show that it is selected (not by colour alone) and expose it to assistive technology, and a bar SHALL show "N selected" with "Select all", "Edit" and "Cancel". "Select all" SHALL select every card the current search and filters show. "Edit" SHALL be disabled while no card is selected. "Cancel" and Android back SHALL leave selection mode and clear the selection; Android back SHALL do so before it leaves the screen, and when a sheet is open it SHALL close the sheet first. Switching between list and grid view SHALL keep the selection and selection mode.

"Edit" SHALL open a sheet with the fields team, year, manufacturer, set, subset, insert, parallel name, rookie, autograph, relic, and grading or condition. Every field SHALL start as "Keep as is". Saving SHALL ask "Change N cards?" in a centred dialog; on confirm, each selected card SHALL get exactly the fields the user changed, a new last-edited time, and SHALL keep every other field as stored, including photos, serial number, card number, player, sort name, notes and quantity. A card whose fields already equal every changed value SHALL not be saved again. All changed cards SHALL be saved locally together and queued for one sync to Drive. After saving, selection mode SHALL end and the list SHALL show the changed cards. With no field changed, saving SHALL not be offered.

With 5,000 cards, selecting, toggling and "Select all" SHALL keep the list and grid rendering only the rows or tiles near the visible part.

#### Scenario: Start by long press
- **GIVEN** the collection list shows cards
- **WHEN** the user long-presses a card
- **THEN** selection mode starts, that card is selected, and the bar shows "1 selected"

#### Scenario: Tap toggles in selection mode
- **GIVEN** selection mode with one card selected
- **WHEN** the user taps another card, then taps it again
- **THEN** the bar shows "2 selected" and then "1 selected", and no card detail opens

#### Scenario: Select all takes the filtered cards
- **GIVEN** 30 cards of which 12 match the filter Set "Chrome"
- **WHEN** the user taps "Select" and then "Select all"
- **THEN** the bar shows "12 selected"

#### Scenario: Back leaves selection mode first
- **GIVEN** selection mode with 3 cards selected and no sheet open
- **WHEN** the user presses Android back
- **THEN** selection mode ends with nothing selected and the collection list is still shown; a second back returns to the dashboard

#### Scenario: Selection survives switching view
- **GIVEN** selection mode in list view with 3 cards selected
- **WHEN** the user switches to grid view
- **THEN** the grid is in selection mode, the same 3 cards show as selected, and the bar shows "3 selected"

#### Scenario: Only changed fields are written
- **GIVEN** 20 selected cards with different teams, players, notes and photos
- **WHEN** the user opens Edit, sets Set to "Heritage", leaves every other field "Keep as is", saves and confirms "Change 20 cards?"
- **THEN** all 20 cards have set "Heritage" and a new last-edited time, and their team, player, card number, serial number, notes, quantity and photos are as before

#### Scenario: Flags and grading
- **GIVEN** 2 selected cards, one raw in "Near Mint" and one graded "PSA 9"
- **WHEN** the user sets Rookie to "Yes" and Grading to raw "Mint", and confirms
- **THEN** both cards are rookies, raw in "Mint", and their autograph and relic marks are unchanged

#### Scenario: Parallel name on a base card
- **GIVEN** 2 selected cards, one with no parallel and one with parallel "Refractor" serial 12 of 99
- **WHEN** the user sets Parallel name to "Gold" and confirms
- **THEN** the first card has parallel "Gold" with no serial number or print run, and the second has parallel "Gold" still serial 12 of 99

#### Scenario: Nothing changed
- **GIVEN** selection mode with cards selected and the Edit sheet open
- **WHEN** every field is still "Keep as is"
- **THEN** the save action is disabled

#### Scenario: One sync after a bulk change
- **GIVEN** 20 selected cards and sync signed in
- **WHEN** the user confirms a bulk change
- **THEN** the sync state shows the changed cards as unsynced until one sync writes them all to Drive

#### Scenario: Large collection stays fast
- **GIVEN** 5,000 cards in list view at 360 by 800 in selection mode
- **WHEN** the user taps "Select all"
- **THEN** the bar shows "5000 selected" and fewer than 100 rows exist in the page
