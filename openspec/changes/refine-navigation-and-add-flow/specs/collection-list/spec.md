## Purpose

Defines what the collection list screen shows so a card can be found and a new one added quickly, with the sync state always visible.

## ADDED Requirements

### Requirement: The first screen holds with the bottom navigation
The system SHALL keep the collection list's first screen usable with the bottom navigation bar and the Add card button above it: the "Cards" title, the count, the sync state, the gear, the search field and the Filter button visible without scrolling, and at least three full card rows inside the list scroller. The list scroller SHALL end at least 8 dp above the top of the Add card button, so the last row can scroll clear of the Add card button and the bar.

#### Scenario: First screen with the bar
- **WHEN** the collection screen opens on a 360 by 800 phone with a 24 dp status bar, a 48 dp bottom inset and the update banner showing
- **THEN** the "Cards" title, the count, the sync state, the Settings gear, the search field, the Filter button and the "Showing N" line are in view, the list scroller's bottom is at least 8 dp above the top of the Add card button, and at least three card rows end above the scroller's bottom

#### Scenario: Last row reachable
- **WHEN** the user scrolls a list of 20 cards to its end
- **THEN** the last row is fully visible above the Add card button and can be tapped
