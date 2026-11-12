## MODIFIED Requirements

### Requirement: Photos are taken from the card form
The system SHALL show, in the photo section of the add and edit card forms, one row holding a Front tile and a Back tile side by side, each a trading-card frame 96 dp tall. An empty tile SHALL show a camera icon and the word "Front" or "Back" and have the accessible name "Add front photo" or "Add back photo"; a filled tile SHALL show that side's photo, whole and uncropped, and have the accessible name "Change front photo" or "Change back photo". Tapping a tile SHALL open a small chooser sheet for that side, which closes with its Close button, a tap on the scrim, Escape or Android back without changing the form. For an empty side the chooser SHALL offer a Scan action ("Scan front" / "Scan back", the rear-camera scanner of the `card-scanner` capability, with its system-camera fallback) and a Pick from photos action ("Pick front from photos" / "Pick back from photos"); for a filled side it SHALL offer "Retake front" / "Retake back", the Pick from photos action and "Remove front photo" / "Remove back photo". Choosing an action SHALL close the chooser. While a photo is being prepared, the tile SHALL be disabled and a "Processing photo…" status SHALL show. After a photo is taken or picked, the user SHALL be on the same form with that photo attached to its side and every field value, suggestion marker and the other side's photo kept. Closing the scanner or picker without a photo SHALL leave the form as it was. Cancel on the add form, once the user confirms Discard (see the `card-form-guidance` capability), SHALL discard the new card and every photo taken for it. On-device recognition SHALL run when a new photo is attached and SHALL fill only fields the user has not edited; Claude SHALL be called only when the user taps "Identify with Claude".

#### Scenario: Photo slots on the add form
- **WHEN** the add form opens from Add card on a 360 by 800 phone
- **THEN** one row shows an empty Front tile and an empty Back tile side by side, each 96 dp tall with a camera icon and its side's word, and every field is empty and editable

#### Scenario: Chooser for an empty side
- **WHEN** the user taps the empty Front tile
- **THEN** a chooser opens offering "Scan front" and "Pick front from photos", and closing it leaves the form unchanged

#### Scenario: Chooser for a filled side
- **GIVEN** the front photo is attached
- **WHEN** the user taps the Front tile
- **THEN** the chooser offers "Retake front", "Pick front from photos" and "Remove front photo"

#### Scenario: Back closes the chooser
- **GIVEN** the user typed a year and opened the Back tile's chooser
- **WHEN** the user presses Android back
- **THEN** the chooser closes, the form is still shown and the year is unchanged

#### Scenario: Fields kept after a scan
- **GIVEN** the user typed "Hank Aaron" as the player on the add form
- **WHEN** the user taps the Front tile, taps "Scan front" and accepts a scan
- **THEN** the same form shows the front photo in the Front tile, the player still reads "Hank Aaron", and the Front tile's chooser now offers "Retake front"

#### Scenario: Scanner closed without a photo
- **GIVEN** the user typed a year on the add form
- **WHEN** the user chooses "Scan back" and closes the scanner without a photo
- **THEN** the Back tile is still empty and the year is unchanged

#### Scenario: Pick from photos
- **WHEN** the user chooses "Pick back from photos" and selects an image
- **THEN** the Back tile shows that image

#### Scenario: Preparing a photo
- **WHEN** a scanned front photo is still being prepared
- **THEN** the Front tile is disabled, "Processing photo…" is shown and Save is disabled until the photo is attached

#### Scenario: Cancel discards
- **WHEN** the user scans a front photo on the add form, taps Cancel and then Discard in the confirmation
- **THEN** no card is added, no photo is stored on the device or queued for Drive, and the screen the user came from is shown

#### Scenario: Identification triggers unchanged
- **WHEN** a front photo is attached on the add form
- **THEN** on-device recognition fills empty, unedited fields as suggestions, "Identify with Claude" is offered, and no request is made to Claude until the user taps it

### Requirement: Capture front and back
The system SHALL let the user take a photo of a card's front and back with the device camera, or choose existing images from the device.

#### Scenario: Camera capture on Android
- **WHEN** the user chooses "Scan front" from the Front tile on the add card form on an Android phone
- **THEN** the card scanner opens on the rear camera (see the `card-scanner` capability), takes the front photo and returns to the form, where the Back tile's chooser offers "Scan back" and "Pick back from photos"

#### Scenario: Camera closed without a photo
- **WHEN** the user backs out of the camera without taking a photo
- **THEN** the form stays as it was, nothing is added, and the tile's chooser still offers "Pick front from photos" or "Pick back from photos"

#### Scenario: Choose existing image
- **WHEN** the user chooses "Pick front from photos" or "Pick back from photos" on the card form and selects an image
- **THEN** that image is used as that side's card photo

### Requirement: Retake and replace
The system SHALL let the user retake, replace or remove a card's front or back photo, and SHALL remove the replaced or removed photo from Drive. Removing a photo on the add form SHALL drop the captured photo; on the edit form the removal SHALL take effect when the card is saved, and Cancel SHALL keep the stored photo. A removed photo still waiting to upload SHALL NOT be uploaded afterwards.

#### Scenario: Replace front photo
- **WHEN** the user replaces a card's front photo and saves
- **THEN** the card shows the new photo and the old photo is no longer in the Drive photos folder

#### Scenario: Remove a stored photo
- **GIVEN** a synced card with a front photo
- **WHEN** the user edits it, chooses "Remove front photo" and saves
- **THEN** the Front tile was empty before saving, the card's detail screen shows no front photo, its list row shows the placeholder frame, and the old front photo and its thumbnail are queued for deletion from the Drive photos folder

#### Scenario: Remove then cancel keeps the photo
- **WHEN** the user edits a card with a front photo, chooses "Remove front photo", taps Cancel and confirms Discard
- **THEN** the card still has its front photo and nothing is queued for deletion

#### Scenario: Remove a captured photo on the add form
- **WHEN** the user scans a front photo on the add form, chooses "Remove front photo" and saves the card
- **THEN** the card is saved without a front photo and no front photo is stored or queued for upload

#### Scenario: Removed before upload
- **GIVEN** a card whose new back photo has not been uploaded yet
- **WHEN** the user removes the back photo, saves, and sync runs
- **THEN** no back photo is uploaded to Drive and the card still has no back photo

### Requirement: View photos
The system SHALL show thumbnails in the collection list, and on the card detail screen the front and back photos at 200 dp tall (a landscape photo at most half the content width), each showing the full photo when it is stored on the device and the thumbnail until then, always whole and uncropped. The detail screen SHALL NOT download a full photo by itself. The system SHALL open a full-size, zoomable view of a photo when it is tapped, fetching and caching the full photo when it is not on the device.

#### Scenario: Detail shows the full photo when stored
- **GIVEN** a card whose full front photo is stored on the device
- **WHEN** the card detail opens
- **THEN** the front photo shown is the full photo, its frame is 200 dp tall within 4 dp, and the photo's ratio is kept within 2 percent

#### Scenario: Detail falls back to the thumbnail
- **GIVEN** a card whose full front photo is not on the device
- **WHEN** the card detail opens, online or offline
- **THEN** the front thumbnail is shown at the same 200 dp size and no full photo is downloaded until the user taps it

#### Scenario: View full photo offline
- **GIVEN** the device is offline and the full photo was not opened on this device before
- **WHEN** the user taps a photo on the card detail
- **THEN** the thumbnail is shown with a note that the full photo will load when online

#### Scenario: Zoom to read serial
- **WHEN** the user pinches to zoom on a full photo
- **THEN** the photo zooms and pans smoothly
