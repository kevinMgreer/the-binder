## ADDED Requirements

### Requirement: Show owned, wanted or all cards
The Filter and sort sheet SHALL hold a "Show" choice with three options, Owned, Wanted and All, as one radio group placed after the order choice and before the Year group. Owned SHALL be the default whenever the app starts, so the list, its count and every dashboard link show owned cards only until the user picks otherwise. Wanted SHALL keep only wanted cards; All SHALL keep both. The choice SHALL combine with the search and every other filter. While Wanted or All is picked, it SHALL count as one applied filter in the badge and show one removable chip, reading "Wanted" or "Owned and wanted"; removing that chip, or Clear all, SHALL return to Owned. Owned SHALL show no chip and add nothing to the badge. Nothing SHALL be added to the title header or the bottom navigation for this choice.

#### Scenario: Default shows owned cards only
- **GIVEN** 5 owned cards and 2 wanted cards
- **WHEN** the user opens the collection list
- **THEN** the list shows 5 cards, no chip row is shown, and the Filter and sort button has no badge

#### Scenario: Show wanted
- **GIVEN** 5 owned cards and 2 wanted cards
- **WHEN** the user picks Show Wanted in the Filter and sort sheet and taps Show cards
- **THEN** the list shows the 2 wanted cards, a "Wanted" chip is shown, and the button is named "Filter and sort, 1 applied"

#### Scenario: Show all
- **GIVEN** 5 owned cards and 2 wanted cards
- **WHEN** the user picks Show All and taps Show cards
- **THEN** the list shows 7 cards and an "Owned and wanted" chip

#### Scenario: Removing the chip returns to owned
- **GIVEN** Show Wanted is picked
- **WHEN** the user removes the "Wanted" chip, or taps Clear all
- **THEN** the list shows owned cards only and no Show chip remains

#### Scenario: Combines with other filters
- **GIVEN** 2 wanted Atlanta Braves cards, 1 wanted Reds card and 4 owned Atlanta Braves cards
- **WHEN** the user picks Show Wanted and Team "Atlanta Braves"
- **THEN** the list shows the 2 wanted Atlanta Braves cards

### Requirement: Wanted cards carry a Wanted tag
Every wanted card's row in list view and tile in grid view SHALL show a "Wanted" tag in text, in the same quiet tag style as the serial tag, and its accessible name SHALL include "wanted". Owned cards SHALL show no tag for this. The tag SHALL NOT change the row height or the tile size.

#### Scenario: Tag in list and grid
- **GIVEN** Show All with one wanted and one owned card
- **WHEN** the list is shown in list view and then in grid view
- **THEN** the wanted card's row and tile show the text "Wanted" and the owned card's do not

### Requirement: Selection and bulk edit leave the Wanted mark alone
The bulk edit sheet SHALL NOT offer Wanted as a field, and a bulk change SHALL keep each changed card's Wanted mark as stored. "Select all" SHALL select only the cards the current Show choice, search and filters show, so with the default Owned it SHALL NOT select a wanted card.

#### Scenario: Select all under the default
- **GIVEN** 5 owned cards and 2 wanted cards and the default Show Owned
- **WHEN** the user taps "Select cards" and then "Select all"
- **THEN** the bar shows "5 selected"

#### Scenario: Bulk change keeps the mark
- **GIVEN** Show All, with one wanted and one owned card selected
- **WHEN** the user sets Set to "Heritage" in the bulk edit sheet and confirms
- **THEN** both cards have set "Heritage", the wanted card is still wanted, the owned card is still owned, and the sheet listed no Wanted field
