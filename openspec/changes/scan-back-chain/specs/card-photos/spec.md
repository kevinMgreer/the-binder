## MODIFIED Requirements

### Requirement: Capture front and back
The system SHALL let the user take a photo of a card's front and back with the device camera, or choose existing images from the device. When the user chooses "Scan front" from an empty Front tile and the scan returns a photo, and the Back tile is empty at that moment (no stored and no captured back photo), the system SHALL open the back scanner at once, as if the user had chosen "Scan back", with no chooser and no extra tap. The system SHALL NOT open the back scanner after "Pick front from photos", after "Retake front", when the Back tile has a photo, when the front scan was closed without a photo or failed, or after any back scan. Closing the back scanner without a photo SHALL leave the form with the front photo attached and show no message; a failed or denied back scan SHALL show the Back tile's usual message and keep the front photo.

#### Scenario: Camera capture on Android
- **WHEN** the user chooses "Scan front" from the Front tile on the add card form on an Android phone
- **THEN** the card scanner opens on the rear camera (see the `card-scanner` capability), takes the front photo and attaches it to the Front tile of the same form

#### Scenario: Front scan goes straight on to the back
- **GIVEN** the add form with both tiles empty and "Hank Aaron" typed as the player
- **WHEN** the user chooses "Scan front" and accepts the scan
- **THEN** the front photo is attached to the Front tile and the back scanner opens without another tap; after the user accepts the back scan, both tiles show their photos and the player still reads "Hank Aaron"

#### Scenario: Back scanner closed after the front
- **WHEN** the user scans the front on the add form and then closes the back scanner without a photo, by its close button or Android back
- **THEN** the form shows the front photo, the Back tile is empty and offers "Scan back" in its chooser, no message is shown and the form is still open

#### Scenario: Back scan fails after the front
- **WHEN** the user scans the front on the add form and the back scan fails or the camera permission is denied
- **THEN** the front photo stays attached and the Back tile shows the same message a failed "Scan back" shows

#### Scenario: No chain after picking the front
- **WHEN** the user chooses "Pick front from photos" on the add form and selects an image
- **THEN** the front photo is attached and no scanner opens

#### Scenario: No chain after a retake
- **GIVEN** the add form with a front photo and an empty Back tile
- **WHEN** the user chooses "Retake front" and accepts the scan
- **THEN** the new front photo replaces the old one and no back scanner opens

#### Scenario: No chain when a back photo exists
- **WHEN** the user edits a card that has a back photo but no front photo, chooses "Scan front" and accepts the scan
- **THEN** the front photo is attached, the stored back photo is kept and no back scanner opens

#### Scenario: No loop after the back
- **WHEN** the user chooses "Scan back" from the empty Back tile with the Front tile empty and accepts the scan
- **THEN** the back photo is attached and no front scanner opens

#### Scenario: Recognition runs for each side
- **WHEN** the user scans the front and the chained back scan on the add form
- **THEN** on-device recognition runs once when the front photo attaches and once when the back photo attaches, fills only empty unedited fields, and no request is made to Claude

#### Scenario: Cancel after the chain discards both photos
- **WHEN** the user scans the front and the chained back on the add form, taps Cancel and then Discard in the confirmation
- **THEN** no card is added and neither photo is stored on the device or queued for Drive

#### Scenario: Camera closed without a photo
- **WHEN** the user backs out of the camera without taking a photo
- **THEN** the form stays as it was, nothing is added, and the tile's chooser still offers "Pick front from photos" or "Pick back from photos"

#### Scenario: Choose existing image
- **WHEN** the user chooses "Pick front from photos" or "Pick back from photos" on the card form and selects an image
- **THEN** that image is used as that side's card photo
