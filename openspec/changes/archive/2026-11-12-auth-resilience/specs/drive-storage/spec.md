## MODIFIED Requirements

### Requirement: Local working copy
The system SHALL keep a local copy of the collection and photo thumbnails on the device, and SHALL show the collection from that copy without waiting for Drive or Google.

#### Scenario: Open the app offline
- **GIVEN** the user has signed in on this device before
- **WHEN** the user opens the app with no network connection
- **THEN** the collection is shown and cards can be browsed, searched, added, edited and deleted

#### Scenario: Offline start keeps queued changes
- **GIVEN** the user opened the app offline and added a card
- **WHEN** the device comes back online and Google gives a token
- **THEN** the card is saved to Drive without the user signing in again
