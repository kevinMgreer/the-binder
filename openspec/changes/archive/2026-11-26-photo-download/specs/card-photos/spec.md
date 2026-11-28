## ADDED Requirements

### Requirement: Save a photo to the phone
The full-size photo view SHALL show, beside its X close button at the top right, one icon-only button with a download icon, named "Save to phone", at least 48 px, in the same style as the X, with no visible text and no new row. Tapping it SHALL save the full photo of the side shown to the phone's gallery, in an album named "The Binder", under the card's photo file name (year, maker, card number, player and side) without its extension. When the full photo is not on the device and the phone is online, the system SHALL fetch and cache it the way the view does, then save it. The system SHALL NOT save a thumbnail. Offline with no full photo on the device, the system SHALL save nothing and say that saving needs a connection. The result SHALL show as a brief status message over the photo, "Saved to Photos" or "Could not save the photo", that goes away by itself after about 3 seconds. While a save runs the button SHALL be disabled. Saving SHALL NOT ask for a storage permission.

#### Scenario: Save the front
- **GIVEN** a card whose full front photo is stored on the device, and the full-size view of the front open
- **WHEN** the user taps "Save to phone"
- **THEN** the gallery receives the full front photo once, named like `2024-topps-1-shohei-ohtani-front-<id>` in the album "The Binder", and the status reads "Saved to Photos"

#### Scenario: Save the side shown
- **GIVEN** a card with a front and a back photo stored on the device, and the full-size view of the front open
- **WHEN** the user switches to the back and taps "Save to phone"
- **THEN** the gallery receives the full back photo, its name ends in "back-<id>", and nothing is saved for the front

#### Scenario: Full photo fetched first
- **GIVEN** the phone is online and a synced card's full front photo is not on the device
- **WHEN** the user opens the full-size view of the front and taps "Save to phone"
- **THEN** the full photo is downloaded from Drive and cached on the device, the gallery receives that full photo and not the thumbnail, and the status reads "Saved to Photos"

#### Scenario: Offline without the full photo
- **GIVEN** the phone is offline and the card's full front photo is not on the device
- **WHEN** the user taps "Save to phone" in the full-size view of the front
- **THEN** nothing is saved to the gallery and the status says a connection is needed to save the full photo

#### Scenario: Save fails
- **GIVEN** the gallery refuses the save
- **WHEN** the user taps "Save to phone"
- **THEN** the status reads "Could not save the photo", the view stays open on the same side, and the button can be tapped again

#### Scenario: Status goes away
- **WHEN** the status "Saved to Photos" has shown for 3 seconds
- **THEN** it is gone and the view shows only the photo and its controls

#### Scenario: Button shape
- **WHEN** the full-size view opens
- **THEN** a button named "Save to phone" is shown beside the X, with a download icon, no visible text, and a hit area of at least 48 by 48 px
