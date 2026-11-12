# card-photos Specification

## Purpose
Lets the owner photograph the front and back of each card with the phone camera, and keeps those photos compact, stored in Drive and viewable in the app.

## Requirements

### Requirement: Photos are taken from the card form
The system SHALL offer, in the photo section of the add and edit card forms, for each of front and back, a Scan action (the rear-camera scanner of the `card-scanner` capability, with its system-camera fallback) and a Pick from photos action. After a photo is taken or picked, the user SHALL be on the same form with that photo attached to its side and every field value, suggestion marker and the other side's photo kept. Closing the scanner or picker without a photo SHALL leave the form as it was. Cancel on the add form, once the user confirms Discard (see the `card-form-guidance` capability), SHALL discard the new card and every photo taken for it. On-device recognition SHALL run when a new photo is attached and SHALL fill only fields the user has not edited; Claude SHALL be called only when the user taps "Identify with Claude".

#### Scenario: Photo slots on the add form
- **WHEN** the add form opens from Add card
- **THEN** the front slot offers "Scan front" and "Pick front from photos", the back slot offers "Scan back" and "Pick back from photos", and every field is empty and editable

#### Scenario: Fields kept after a scan
- **GIVEN** the user typed "Hank Aaron" as the player on the add form
- **WHEN** the user taps "Scan front" and accepts a scan
- **THEN** the same form shows the front photo, the player still reads "Hank Aaron", and the front slot now offers "Retake front"

#### Scenario: Scanner closed without a photo
- **GIVEN** the user typed a year on the add form
- **WHEN** the user taps "Scan back" and closes the scanner without a photo
- **THEN** the form shows no back photo and the year is unchanged

#### Scenario: Pick from photos
- **WHEN** the user taps "Pick back from photos" and selects an image
- **THEN** the form shows that image as the back photo

#### Scenario: Cancel discards
- **WHEN** the user scans a front photo on the add form, taps Cancel and then Discard in the confirmation
- **THEN** no card is added, no photo is stored on the device or queued for Drive, and the screen the user came from is shown

#### Scenario: Identification triggers unchanged
- **WHEN** a front photo is attached on the add form
- **THEN** on-device recognition fills empty, unedited fields as suggestions, "Identify with Claude" is offered, and no request is made to Claude until the user taps it

### Requirement: Capture front and back
The system SHALL let the user take a photo of a card's front and back with the device camera, or choose existing images from the device.

#### Scenario: Camera capture on Android
- **WHEN** the user taps "Scan front" on the add card form on an Android phone
- **THEN** the card scanner opens on the rear camera (see the `card-scanner` capability), takes the front photo and returns to the form, where the back slot offers "Scan back" and "Pick back from photos"

#### Scenario: Camera closed without a photo
- **WHEN** the user backs out of the camera without taking a photo
- **THEN** the form stays as it was, nothing is added, and "Pick front from photos" or "Pick back from photos" remains available

#### Scenario: Choose existing image
- **WHEN** the user chooses "Pick front from photos" or "Pick back from photos" on the card form and selects an image
- **THEN** that image is used as that side's card photo

### Requirement: Compress photos
The system SHALL resize and compress each photo on the device before storing it, keeping enough detail to read the card number and serial number, and producing a separate small thumbnail.

#### Scenario: Large phone photo
- **WHEN** the user captures a 12-megapixel photo
- **THEN** the stored full photo is no more than 500 KB and the serial number stamp is still legible when zoomed in

### Requirement: Retake and replace
The system SHALL let the user retake or replace a card's front or back photo, and SHALL remove the replaced photo from Drive.

#### Scenario: Replace front photo
- **WHEN** the user replaces a card's front photo and saves
- **THEN** the card shows the new photo and the old photo is no longer in the Drive photos folder

### Requirement: View photos
The system SHALL show thumbnails in the collection list and thumbnails of the front and back photos on the card detail screen, and SHALL open a full-size, zoomable view of a photo when its thumbnail is tapped, fetching and caching the full photo when it is not on the device.

#### Scenario: View full photo offline
- **GIVEN** the device is offline and the full photo was not opened on this device before
- **WHEN** the user taps a photo thumbnail on the card detail
- **THEN** the thumbnail is shown with a note that the full photo will load when online

#### Scenario: Zoom to read serial
- **WHEN** the user pinches to zoom on a full photo
- **THEN** the photo zooms and pans smoothly

### Requirement: Photos stored as named files
The system SHALL save each photo in the Drive photos folder under a name that identifies the card and side, so photos are recognizable when browsed in Google Drive.

#### Scenario: Browse photos in Google Drive
- **WHEN** the user opens the photos folder in Google Drive
- **THEN** each file name includes the year, player, card number and "front" or "back"
