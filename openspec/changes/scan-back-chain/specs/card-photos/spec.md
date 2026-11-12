## MODIFIED Requirements

### Requirement: Capture front and back
The system SHALL let the user take a photo of a card's front and back with the device camera, or choose existing images from the device. When the user chooses "Scan front" from an empty Front tile and the Back tile is empty at that moment (no stored and no captured back photo), the system SHALL open one scanner session for both sides: the first page is the front and the second the back, with no return to the form between them. When that session ends with two pages, the system SHALL attach the first to the Front tile and the second to the Back tile; with one page, only the front, with no message. A session closed without accepting, or one that fails, SHALL attach nothing. Every other scan ("Retake front", "Scan back", "Retake back", and "Scan front" while the Back tile has a photo) SHALL take one page for its own side.

#### Scenario: Camera capture on Android
- **WHEN** the user chooses "Scan front" from the Front tile on the add card form on an Android phone
- **THEN** the card scanner opens on the rear camera (see the `card-scanner` capability), takes the front photo and attaches it to the Front tile of the same form

#### Scenario: Front and back in one scan
- **GIVEN** the add form with both tiles empty and "Hank Aaron" typed as the player
- **WHEN** the user chooses "Scan front", scans the front, goes on to a second page for the back and accepts
- **THEN** the form is not shown between the two pages, and when the scanner closes the Front tile shows the front, the Back tile shows the back and the player still reads "Hank Aaron"

#### Scenario: Done after the front only
- **WHEN** the user scans the front on the add form and accepts without a second page
- **THEN** the form shows the front photo, the Back tile is empty and offers "Scan back" in its chooser, no message is shown and the form is still open

#### Scenario: Scan closed or failed
- **WHEN** the user closes the two-page scanner without accepting (its close button or Android back), or the scan fails or the camera permission is denied
- **THEN** neither tile gets a photo; a failure shows the Front tile's usual message

#### Scenario: No back page after picking the front
- **WHEN** the user chooses "Pick front from photos" on the add form and selects an image
- **THEN** the front photo is attached and no scanner opens

#### Scenario: Retake takes one page
- **GIVEN** the add form with a front photo and an empty Back tile
- **WHEN** the user chooses "Retake front" and accepts the scan
- **THEN** the scanner takes one page, the new front photo replaces the old one and the Back tile stays empty

#### Scenario: One page when a back photo exists
- **WHEN** the user edits a card that has a back photo but no front photo, chooses "Scan front" and accepts the scan
- **THEN** the scanner takes one page, the front photo is attached and the stored back photo is kept

#### Scenario: Scan back takes one page
- **WHEN** the user chooses "Scan back" from the empty Back tile with the Front tile empty and accepts the scan
- **THEN** the back photo is attached and the Front tile stays empty

#### Scenario: Each page is processed and recognized
- **WHEN** the user scans the front and the back in one session on the add form
- **THEN** each photo is compressed and gets a thumbnail like a single scan, Save stays disabled until both are ready, on-device recognition runs once over the two photos and fills only empty unedited fields, and no request is made to Claude

#### Scenario: Cancel after a two-page scan discards both photos
- **WHEN** the user scans the front and the back in one session on the add form, taps Cancel and then Discard in the confirmation
- **THEN** no card is added and neither photo is stored on the device or queued for Drive

#### Scenario: Camera closed without a photo
- **WHEN** the user backs out of the camera without taking a photo
- **THEN** the form stays as it was, nothing is added, and the tile's chooser still offers "Pick front from photos" or "Pick back from photos"

#### Scenario: Choose existing image
- **WHEN** the user chooses "Pick front from photos" or "Pick back from photos" on the card form and selects an image
- **THEN** that image is used as that side's card photo
